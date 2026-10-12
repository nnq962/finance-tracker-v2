import "server-only"

import type {
  Account,
  AccountFormValues,
  AccountStatus,
  AccountType,
} from "@/lib/accounts/types"
import { AccountValidationError } from "@/lib/accounts/validation"
import { lockAccounts, MAX_MONEY } from "@/lib/db/accounts"
import { getDb } from "@/lib/db/client"
import { retryOnDeadlock } from "@/lib/db/retry"
import { getInstitution } from "@/lib/institutions"

function getLogoFallback(name: string, institutionName?: string) {
  return (institutionName ?? name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const rows = await getDb()
    .selectFrom("accounts")
    .selectAll()
    .where("userId", "=", userId)
    .orderBy("createdAt")
    .orderBy("id")
    .execute()

  const linked = await getLinkedAccountIds(userId)

  return rows.map((row) => {
    const type = row.type as AccountType
    const institution =
      type !== "cash" && row.institutionId
        ? getInstitution(type, row.institutionId)
        : undefined
    const institutionName = institution?.shortName ?? institution?.name

    return {
      id: row.id,
      name: row.name,
      type,
      openingBalance: row.openingBalance,
      balance: row.balance,
      institutionId: row.institutionId ?? undefined,
      institutionName,
      note: row.note ?? undefined,
      logoUrl: institution?.logoPath,
      logoFallback: getLogoFallback(row.name, institutionName),
      status: row.status as AccountStatus,
      excluded: row.excluded,
      linked: linked.has(row.id),
      openedAt: row.openedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  })
}

/**
 * Accounts tied to others or to loans: a transfer to or from them, a loan
 * recorded into them, a repayment through them. Deleting one would change
 * another account's balance or a loan's, so they can only be archived.
 */
async function getLinkedAccountIds(userId: string, executor: Pick<ReturnType<typeof getDb>, "selectFrom"> = getDb(), accountId?: string) {
  const [transfers, debts, payments] = await Promise.all([
    executor
      .selectFrom("transactions")
      .select(["fromAccountId", "toAccountId"])
      .where("userId", "=", userId)
      .where("kind", "=", "transfer")
      .$if(Boolean(accountId), (query) =>
        query.where((eb) => eb.or([eb("fromAccountId", "=", accountId!), eb("toAccountId", "=", accountId!)])),
      )
      .execute(),
    executor
      .selectFrom("debts")
      .select("accountId")
      .where("userId", "=", userId)
      .where("accountId", "is not", null)
      .$if(Boolean(accountId), (query) => query.where("accountId", "=", accountId!))
      .execute(),
    executor
      .selectFrom("debtPayments")
      .select("accountId")
      .where("userId", "=", userId)
      .$if(Boolean(accountId), (query) => query.where("accountId", "=", accountId!))
      .execute(),
  ])
  return new Set(
    [
      ...transfers.flatMap((row) => [row.fromAccountId, row.toAccountId]),
      ...debts.map((row) => row.accountId),
      ...payments.map((row) => row.accountId),
    ].filter((id): id is string => Boolean(id)),
  )
}

/** The request id becomes the account id, so a retried request adds nothing. */
export async function createAccount(
  userId: string,
  values: AccountFormValues,
  requestId?: string,
) {
  const inserted = await getDb()
    .insertInto("accounts")
    .values({
      ...(requestId ? { id: requestId } : {}),
      userId,
      name: values.name,
      type: values.type,
      institutionId: values.institutionId ?? null,
      openingBalance: values.balance,
      balance: values.balance,
      note: values.note ?? null,
      openedAt: values.openedAt,
      excluded: values.excluded,
    })
    .onConflict((conflict) => conflict.column("id").doNothing())
    .returning("id")
    .executeTakeFirst()

  if (!inserted && requestId) {
    const existing = await getDb()
      .selectFrom("accounts")
      .select("userId")
      .where("id", "=", requestId)
      .executeTakeFirst()
    if (existing?.userId !== userId) throw new AccountValidationError("Tài khoản không hợp lệ.")
  }
}

export async function updateAccount(
  userId: string,
  accountId: string,
  values: AccountFormValues,
  expectedBalance: number,
) {
  await getDb().transaction().execute(async (trx) => {
    const account = (await lockAccounts(trx, userId, [accountId])).get(accountId)

    if (!account || account.status !== "active") {
      throw new AccountValidationError("Tài khoản đã ngừng sử dụng. Hãy kích hoạt lại trước khi chỉnh sửa.")
    }

    // The balance is overwritten directly, without a transaction record, and
    // only when the user changed it; reject if it moved since the form opened.
    const balanceChanged = values.balance !== expectedBalance

    if (balanceChanged && account.balance !== expectedBalance) {
      throw new AccountValidationError("Số dư tài khoản vừa thay đổi. Vui lòng tải lại trang rồi thử lại.")
    }

    // A corrected balance is written down as a "Điều chỉnh số dư" transaction
    // for the difference, as MISA does, left out of the figures until the
    // user counts it; the opening balance stays what it was, so the opening
    // balance and the transactions still add up to the balance.
    if (balanceChanged) {
      const difference = values.balance - account.balance
      if (Math.abs(difference) > MAX_MONEY) throw new AccountValidationError("Số tiền điều chỉnh vượt giới hạn cho phép.")
      await trx
        .insertInto("transactions")
        .values({
          userId,
          kind: difference > 0 ? "income" : "expense",
          amount: Math.abs(difference),
          accountId,
          adjustment: true,
          excluded: true,
          occurredAt: new Date(),
        })
        .execute()
    }

    await trx
      .updateTable("accounts")
      .set({
        ...(balanceChanged ? { balance: values.balance } : {}),
        name: values.name,
        type: values.type,
        institutionId: values.institutionId ?? null,
        note: values.note ?? null,
        openedAt: values.openedAt,
        excluded: values.excluded,
      })
      .where("id", "=", accountId)
      .execute()
  })
}

export async function setAccountArchived(
  userId: string,
  accountId: string,
  archived: boolean,
) {
  const result = await getDb()
    .updateTable("accounts")
    .set({ status: archived ? "archived" : "active" })
    .where("id", "=", accountId)
    .where("userId", "=", userId)
    .executeTakeFirst()

  // Deleted meanwhile (on another device): say so rather than claim it was done.
  if (result.numUpdatedRows === BigInt(0)) {
    throw new AccountValidationError("Không tìm thấy tài khoản. Vui lòng tải lại trang.")
  }
}

/**
 * Deletes the account with its own income and spending, atomically. An
 * account tied to others (a transfer, a loan, a repayment) is refused:
 * deleting it would change another account's balance or a loan's, so it can
 * only be archived. Should the database break a deadlock with a concurrent
 * change, it runs again.
 */
export async function deleteAccount(userId: string, accountId: string) {
  return retryOnDeadlock(() => deleteAccountOnce(userId, accountId))
}

async function deleteAccountOnce(userId: string, accountId: string) {
  await getDb().transaction().execute(async (trx) => {
    const account = (await lockAccounts(trx, userId, [accountId])).get(accountId)
    if (!account) return

    if ((await getLinkedAccountIds(userId, trx, accountId)).size > 0) {
      throw new AccountValidationError(
        "Tài khoản đã có chuyển khoản hoặc vay nợ nên không xoá được. Hãy chọn Ngừng sử dụng.",
      )
    }

    await trx
      .deleteFrom("transactions")
      .where("userId", "=", userId)
      .where("accountId", "=", accountId)
      .execute()
    await trx.deleteFrom("accounts").where("id", "=", accountId).execute()
  })
}
