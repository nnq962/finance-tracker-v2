import "server-only"

import { sql, type Transaction as DbTransaction } from "kysely"

import { lockAccounts, setBalance, shiftBalance, type LockedAccount } from "@/lib/db/accounts"
import { getDb } from "@/lib/db/client"
import type { DB } from "@/lib/db/types"
import type {
  SupportedTransactionKind,
  Transaction,
  TransactionFormValues,
} from "@/lib/transactions/types"
import { TransactionValidationError } from "@/lib/transactions/validation"

type Movement = {
  kind: string
  amount: number
  fee: number
  accountId: string | null
  fromAccountId: string | null
  toAccountId: string | null
}

function getAccountIds(values: Movement) {
  return [values.accountId, values.fromAccountId, values.toAccountId]
    .filter((id): id is string => Boolean(id))
}

function getBalanceImpacts(values: Movement) {
  if (values.kind === "transfer") {
    return new Map([
      [values.fromAccountId!, -(values.amount + values.fee)],
      [values.toAccountId!, values.amount],
    ])
  }

  return new Map([[values.accountId!, values.kind === "expense" ? -values.amount : values.amount]])
}

function toMovement(values: TransactionFormValues): Movement {
  return values.kind === "transfer"
    ? {
      kind: values.kind,
      amount: values.amount,
      fee: values.fee,
      accountId: null,
      fromAccountId: values.fromAccountId,
      toAccountId: values.toAccountId,
    }
    : {
      kind: values.kind,
      amount: values.amount,
      fee: 0,
      accountId: values.accountId,
      fromAccountId: null,
      toAccountId: null,
    }
}

async function applyImpacts(
  trx: DbTransaction<DB>,
  accounts: Map<string, LockedAccount>,
  impacts: Map<string, number>,
) {
  for (const [accountId, delta] of impacts) {
    if (delta === 0) continue

    const account = accounts.get(accountId)
    const balance = account ? shiftBalance(account.balance, delta) : null

    // Accounts may go below zero; only the bound either way stops a transaction.
    if (balance === null) {
      throw new TransactionValidationError("Số dư tài khoản vượt quá giới hạn cho phép.")
    }

    await setBalance(trx, accountId, balance)
  }
}

function selectTransactions(userId: string) {
  return getDb()
    .selectFrom("transactions as t")
    .leftJoin("accounts as a", "a.id", "t.accountId")
    .leftJoin("accounts as fa", "fa.id", "t.fromAccountId")
    .leftJoin("accounts as ta", "ta.id", "t.toAccountId")
    .leftJoin("categoryItems as ci", "ci.id", "t.categoryItemId")
    .leftJoin("categoryGroups as cg", "cg.id", "ci.groupId")
    .leftJoin("debts as d", "d.id", "t.debtId")
    .leftJoin("contacts as c", "c.id", "d.contactId")
    .select([
      "t.id", "t.kind", "t.amount", "t.fee", "t.note", "t.occurredAt", "t.debtId",
      "t.accountId", "a.name as accountName",
      "t.fromAccountId", "fa.name as fromAccountName",
      "t.toAccountId", "ta.name as toAccountName",
      "t.categoryItemId", "ci.name as categoryName",
      "ci.groupId as categoryGroupId", "cg.name as categoryGroupName",
      "d.direction as debtDirection", "c.name as contactName",
    ])
    .where("t.userId", "=", userId)
    .orderBy("t.occurredAt", "desc")
    .orderBy("t.id", "desc")
}

type TransactionRow = Awaited<ReturnType<ReturnType<typeof selectTransactions>["execute"]>>[number]

function toTransaction(row: TransactionRow): Transaction {
  const kind = row.kind as SupportedTransactionKind
  const note = row.note ?? undefined
  const occurredAt = row.occurredAt.toISOString()

  if (kind === "transfer") {
    const fromAccountName = row.fromAccountName ?? undefined
    const toAccountName = row.toAccountName ?? undefined

    return {
      id: row.id,
      kind,
      title: "Chuyển khoản",
      description: `${fromAccountName ?? "Tài khoản"} → ${toAccountName ?? "Tài khoản"}${row.fee ? ` · Phí ${row.fee.toLocaleString("vi-VN")}đ` : ""}`,
      amount: row.amount,
      fee: row.fee,
      fromAccountId: row.fromAccountId ?? undefined,
      fromAccountName,
      toAccountId: row.toAccountId ?? undefined,
      toAccountName,
      note,
      occurredAt,
    }
  }

  // A loan's initial cash movement has no category; it is labelled from the loan.
  const categoryName = row.debtId
    ? `${row.debtDirection === "borrowed" ? "Đi vay" : "Cho vay"} · ${row.contactName ?? "Người liên hệ"}`
    : row.categoryName ?? undefined
  const categoryGroupName = row.debtId ? "Vay & nợ" : row.categoryGroupName ?? undefined
  const accountName = row.accountName ?? undefined

  return {
    id: row.id,
    ...(row.debtId ? { source: "debt" as const, debtId: row.debtId } : {}),
    kind,
    title: categoryName ?? "Giao dịch",
    description: `${categoryGroupName ?? "Hạng mục"} · ${accountName ?? "Tài khoản"}`,
    amount: kind === "expense" ? -row.amount : row.amount,
    accountId: row.accountId ?? undefined,
    accountName,
    categoryId: row.categoryItemId ?? undefined,
    categoryName,
    categoryGroupId: row.categoryGroupId ?? undefined,
    categoryGroupName,
    note,
    occurredAt,
  }
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const rows = await selectTransactions(userId).execute()
  return rows.map(toTransaction)
}

/**
 * The latest transactions that moved money in or out of each account, in two
 * queries whatever the number of accounts: rank every account movement (a
 * transfer counts for both of its accounts), then load the top ones.
 */
export async function getRecentTransactionsByAccount(
  userId: string,
  limit = 5,
): Promise<Record<string, Transaction[]>> {
  const ranked = await sql<{ accountId: string; id: string }>`
    SELECT account_id, id FROM (
      SELECT m.account_id, m.id, row_number() OVER (
        PARTITION BY m.account_id ORDER BY m.occurred_at DESC, m.id DESC
      ) AS position
      FROM (
        SELECT id, occurred_at, account_id FROM transactions
        WHERE user_id = ${userId} AND account_id IS NOT NULL
        UNION ALL
        SELECT id, occurred_at, from_account_id FROM transactions
        WHERE user_id = ${userId} AND from_account_id IS NOT NULL
        UNION ALL
        SELECT id, occurred_at, to_account_id FROM transactions
        WHERE user_id = ${userId} AND to_account_id IS NOT NULL
      ) AS m (id, occurred_at, account_id)
    ) AS ranked
    WHERE position <= ${limit}
  `.execute(getDb())
  if (ranked.rows.length === 0) return {}

  const rows = await selectTransactions(userId)
    .where("t.id", "in", [...new Set(ranked.rows.map((row) => row.id))])
    .execute()
  const accountsById = new Map<string, string[]>()
  for (const { accountId, id } of ranked.rows) {
    accountsById.set(id, [...(accountsById.get(id) ?? []), accountId])
  }
  const byAccount: Record<string, Transaction[]> = {}
  // selectTransactions orders newest first; that order is kept per account.
  for (const row of rows) {
    const transaction = toTransaction(row)
    for (const accountId of accountsById.get(row.id) ?? []) {
      (byAccount[accountId] ??= []).push(transaction)
    }
  }
  return byAccount
}

export async function getTransactionsInRange(
  userId: string,
  start: Date,
  end: Date,
  // A loan's money moving in or out is kept with the loan, not with spending.
  { excludeDebts = false }: { excludeDebts?: boolean } = {},
): Promise<Transaction[]> {
  const rows = await selectTransactions(userId)
    .where("t.occurredAt", ">=", start)
    .where("t.occurredAt", "<", end)
    .$if(excludeDebts, (query) => query.where("t.debtId", "is", null))
    .execute()

  return rows.map(toTransaction)
}

/**
 * Locks and checks the accounts and category of a new or edited transaction.
 * When editing, the accounts and category it already uses may be archived.
 */
async function prepare(
  trx: DbTransaction<DB>,
  userId: string,
  values: TransactionFormValues,
  existing?: Movement & { categoryItemId: string | null },
) {
  const accountIds = getAccountIds(toMovement(values))
  const previousAccountIds = existing ? getAccountIds(existing) : []
  const accounts = await lockAccounts(trx, userId, [...accountIds, ...previousAccountIds])

  for (const accountId of accountIds) {
    const account = accounts.get(accountId)

    if (!account || (account.status !== "active" && !previousAccountIds.includes(accountId))) {
      throw new TransactionValidationError(
        "Tài khoản không tồn tại hoặc đã ngừng sử dụng.",
      )
    }
  }

  if (previousAccountIds.some((accountId) => !accounts.has(accountId))) {
    throw new TransactionValidationError(
      "Tài khoản của giao dịch cũ không còn tồn tại.",
    )
  }

  if (values.kind !== "transfer") {
    const category = await trx
      .selectFrom("categoryItems as ci")
      .innerJoin("categoryGroups as cg", "cg.id", "ci.groupId")
      .select(["ci.type", "ci.status", "cg.status as groupStatus"])
      .where("ci.id", "=", values.categoryId)
      .where("ci.userId", "=", userId)
      .executeTakeFirst()
    const isPreviousCategory = existing?.categoryItemId === values.categoryId

    if (!category || (category.status !== "active" && !isPreviousCategory)) {
      throw new TransactionValidationError(
        "Hạng mục không tồn tại hoặc đã ngừng sử dụng.",
      )
    }

    if (category.type !== values.kind) {
      throw new TransactionValidationError(
        "Hạng mục không phù hợp với loại giao dịch.",
      )
    }

    if (category.groupStatus !== "active" && !isPreviousCategory) {
      throw new TransactionValidationError(
        "Nhóm hạng mục không tồn tại hoặc đã ngừng sử dụng.",
      )
    }
  }

  return accounts
}

function toRow(values: TransactionFormValues) {
  return {
    ...toMovement(values),
    categoryItemId: values.kind === "transfer" ? null : values.categoryId,
    note: values.note ?? null,
    occurredAt: values.occurredAt,
  }
}

/**
 * Records a transaction and moves its accounts' balances. The request id
 * becomes the row id, so a retried request (lost response, double submit)
 * finds its row and changes nothing a second time.
 */
export async function createTransaction(
  userId: string,
  values: TransactionFormValues,
  requestId?: string,
) {
  await getDb().transaction().execute(async (trx) => {
    // Locks the accounts first, so a concurrent retry waits here and then
    // sees the row this request inserted.
    const accounts = await prepare(trx, userId, values)

    if (requestId) {
      const existing = await trx
        .selectFrom("transactions")
        .select("userId")
        .where("id", "=", requestId)
        .executeTakeFirst()
      if (existing?.userId === userId) return
      if (existing) throw new TransactionValidationError("Giao dịch không hợp lệ.")
    }

    await applyImpacts(trx, accounts, getBalanceImpacts(toMovement(values)))
    await trx
      .insertInto("transactions")
      .values({ ...(requestId ? { id: requestId } : {}), userId, ...toRow(values) })
      .execute()
  })
}

async function lockExisting(
  trx: DbTransaction<DB>,
  userId: string,
  transactionId: string,
  action: "sửa" | "xoá",
) {
  const existing = await trx
    .selectFrom("transactions")
    .select(["kind", "amount", "fee", "accountId", "fromAccountId", "toAccountId", "categoryItemId", "debtId"])
    .where("id", "=", transactionId)
    .where("userId", "=", userId)
    .forUpdate()
    .executeTakeFirst()

  if (!existing) {
    throw new TransactionValidationError("Giao dịch không tồn tại.")
  }

  if (existing.debtId) {
    throw new TransactionValidationError(
      `Hãy ${action} giao dịch này tại trang Nợ & Cho vay để giữ đồng bộ khoản nợ.`,
    )
  }

  return existing
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  values: TransactionFormValues,
) {
  await getDb().transaction().execute(async (trx) => {
    const existing = await lockExisting(trx, userId, transactionId, "sửa")
    const accounts = await prepare(trx, userId, values, existing)
    const impacts = new Map<string, number>()
    const merge = (accountId: string, delta: number) =>
      impacts.set(accountId, (impacts.get(accountId) ?? 0) + delta)

    getBalanceImpacts(existing).forEach((delta, accountId) => merge(accountId, -delta))
    getBalanceImpacts(toMovement(values)).forEach((delta, accountId) => merge(accountId, delta))

    await applyImpacts(trx, accounts, impacts)
    await trx
      .updateTable("transactions")
      .set(toRow(values))
      .where("id", "=", transactionId)
      .execute()
  })
}

export async function deleteTransaction(userId: string, transactionId: string) {
  await getDb().transaction().execute(async (trx) => {
    const existing = await lockExisting(trx, userId, transactionId, "xoá")
    const accounts = await lockAccounts(trx, userId, getAccountIds(existing))
    const impacts = new Map<string, number>()

    getBalanceImpacts(existing).forEach((delta, accountId) => impacts.set(accountId, -delta))
    await applyImpacts(trx, accounts, impacts)
    await trx.deleteFrom("transactions").where("id", "=", transactionId).execute()
  })
}
