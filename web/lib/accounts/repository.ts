import "server-only"

import type {
  Account,
  AccountFormValues,
  AccountStatus,
  AccountType,
} from "@/lib/accounts/types"
import { AccountValidationError } from "@/lib/accounts/validation"
import { lockAccounts, setBalance, shiftBalance } from "@/lib/db/accounts"
import { getDb } from "@/lib/db/client"
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
      openedAt: row.openedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  })
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

    // A corrected balance means the account started with that much more or
    // less: the opening balance moves with it, so the opening balance and the
    // transactions still add up to the balance, and what the account shows
    // as having moved since is only what its transactions moved.
    let openingBalance: number | undefined
    if (balanceChanged) {
      const { openingBalance: current } = await trx
        .selectFrom("accounts")
        .select("openingBalance")
        .where("id", "=", accountId)
        .executeTakeFirstOrThrow()
      const shifted = shiftBalance(current, values.balance - account.balance)
      if (shifted === null) throw new AccountValidationError("Số dư không hợp lệ.")
      openingBalance = shifted
    }

    await trx
      .updateTable("accounts")
      .set({
        ...(balanceChanged ? { balance: values.balance, openingBalance } : {}),
        name: values.name,
        type: values.type,
        institutionId: values.institutionId ?? null,
        note: values.note ?? null,
        openedAt: values.openedAt,
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

/** Postgres gave up one of two transactions waiting on each other: running it again succeeds. */
function isDeadlock(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "40P01"
}

/**
 * Deletes the account with every transaction that touches it and every loan
 * recorded into it (with all of that loan's payments), and reverses their
 * effect on the user's other accounts, atomically. A loan recorded into
 * another account stays: only its payments from this account go, which moved
 * no other account. Should the database break a deadlock with a concurrent
 * change (a transfer, a loan payment, locking in another order), it runs again.
 */
export async function deleteAccount(userId: string, accountId: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await deleteAccountOnce(userId, accountId)
    } catch (error) {
      if (!isDeadlock(error) || attempt === 3) throw error
    }
  }
}

async function deleteAccountOnce(userId: string, accountId: string) {
  await getDb().transaction().execute(async (trx) => {
    const account = (await lockAccounts(trx, userId, [accountId])).get(accountId)
    if (!account) return

    const transactions = await trx
      .selectFrom("transactions")
      .select(["id", "kind", "amount", "fee", "accountId", "fromAccountId", "toAccountId"])
      .where("userId", "=", userId)
      // A loan's own cash movement goes with the loan below.
      .where("debtId", "is", null)
      .where((eb) => eb.or([
        eb("accountId", "=", accountId),
        eb("fromAccountId", "=", accountId),
        eb("toAccountId", "=", accountId),
      ]))
      .execute()

    // The loans recorded into this account go whole.
    const debts = await trx
      .selectFrom("debts")
      .select(["id", "direction", "recordingMode", "accountId", "amount"])
      .where("userId", "=", userId)
      .where("accountId", "=", accountId)
      .forUpdate()
      .execute()

    const payments = debts.length
      ? await trx
        .selectFrom("debtPayments")
        .select(["debtId", "accountId", "amount"])
        .where("debtId", "in", debts.map((debt) => debt.id))
        .execute()
      : []

    // Undo each movement on the accounts that are kept.
    const deltas = new Map<string, number>()
    const addDelta = (id: string | null, value: number) => {
      if (id && id !== accountId) deltas.set(id, (deltas.get(id) ?? 0) + value)
    }

    for (const transaction of transactions) {
      if (transaction.kind === "transfer") {
        addDelta(transaction.fromAccountId, transaction.amount + transaction.fee)
        addDelta(transaction.toAccountId, -transaction.amount)
      } else {
        addDelta(transaction.accountId, transaction.kind === "income" ? -transaction.amount : transaction.amount)
      }
    }

    for (const debt of debts) {
      // Borrowing brought money in; lending sent it out. Payments go the other way.
      const principalSign = debt.direction === "borrowed" ? 1 : -1
      if (debt.recordingMode !== "opening") addDelta(debt.accountId, -principalSign * debt.amount)
      for (const payment of payments.filter((item) => item.debtId === debt.id)) {
        addDelta(payment.accountId, principalSign * payment.amount)
      }
    }

    const relatedAccounts = await lockAccounts(trx, userId, deltas.keys())

    for (const [id, delta] of deltas) {
      const related = relatedAccounts.get(id)
      const balance = related ? shiftBalance(related.balance, delta) : null

      if (balance === null) {
        throw new AccountValidationError(
          "Không thể xoá vì số dư của tài khoản liên quan sẽ không hợp lệ.",
        )
      }
      if (delta !== 0) await setBalance(trx, id, balance)
    }

    if (transactions.length) {
      await trx
        .deleteFrom("transactions")
        .where("id", "in", transactions.map((transaction) => transaction.id))
        .execute()
    }
    if (debts.length) {
      // Cascades to the loans' payments and cash movements.
      await trx
        .deleteFrom("debts")
        .where("id", "in", debts.map((debt) => debt.id))
        .execute()
    }
    // Other loans' payments from this account: they only moved this account.
    await trx
      .deleteFrom("debtPayments")
      .where("userId", "=", userId)
      .where("accountId", "=", accountId)
      .execute()
    await trx.deleteFrom("accounts").where("id", "=", accountId).execute()
  })
}
