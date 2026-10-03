import "server-only"

import { createHash } from "node:crypto"
import type { Transaction } from "kysely"

import { lockAccounts, setBalance, shiftBalance, type LockedAccount } from "@/lib/db/accounts"
import { getDb } from "@/lib/db/client"
import type { DB } from "@/lib/db/types"
import { getPaymentMetrics, todayDate, updateDebtPayment } from "./calculations"
import type { Contact, Debt, DebtPayment, NewDebt } from "./types"
import { assertDebtId, DebtValidationError, MAX_MONEY, parseContact, parseDebt, parsePayment } from "./validation"

type Trx = Transaction<DB>

function fingerprint(kind: string, input: unknown) {
  return createHash("sha256").update(JSON.stringify({ kind, input })).digest("hex")
}

/**
 * Records a request id. Returns true when that request was already applied,
 * so a retried request returns the current state instead of applying twice.
 * A concurrent duplicate waits on the primary key until the first one ends.
 */
async function alreadyApplied(trx: Trx, userId: string, operationId: string, hash: string) {
  const inserted = await trx
    .insertInto("debtOperations")
    .values({ userId, id: operationId, fingerprint: hash })
    .onConflict((conflict) => conflict.columns(["userId", "id"]).doNothing())
    .returning("id")
    .executeTakeFirst()

  if (inserted) return false

  const existing = await trx
    .selectFrom("debtOperations")
    .select("fingerprint")
    .where("userId", "=", userId)
    .where("id", "=", operationId)
    .executeTakeFirstOrThrow()

  if (existing.fingerprint !== hash) {
    throw new DebtValidationError("Yêu cầu này đã được dùng cho một thay đổi khác. Vui lòng thử lại.")
  }
  return true
}

const optional = (value: string | undefined) => value || null

function getInitials(name: string) {
  return name.split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi-VN")
}

type ContactRow = { id: string; name: string; initials: string; relationship: string | null; phone: string | null; note: string | null }

function toContact(row: ContactRow): Contact {
  return {
    id: row.id, name: row.name, initials: row.initials,
    relationship: row.relationship ?? undefined, phone: row.phone ?? undefined, note: row.note ?? undefined,
  }
}

const contactColumns = ["id", "name", "initials", "relationship", "phone", "note"] as const

export async function getContacts(userId: string): Promise<Contact[]> {
  const rows = await getDb()
    .selectFrom("contacts")
    .select(contactColumns)
    .where("userId", "=", userId)
    .orderBy("createdAt")
    .orderBy("id")
    .execute()
  return rows.map(toContact)
}

async function getContact(db: Trx, userId: string, contactId: string) {
  const row = await db
    .selectFrom("contacts")
    .select(contactColumns)
    .where("userId", "=", userId)
    .where("id", "=", contactId)
    .executeTakeFirst()
  if (!row) throw new DebtValidationError("Người liên hệ không tồn tại.")
  return toContact(row)
}

function selectDebts(db: Trx | ReturnType<typeof getDb>, userId: string) {
  return db
    .selectFrom("debts")
    .select([
      "id", "contactId", "recordingMode", "accountId", "direction", "amount",
      "interestRate", "interestPeriod", "note", "recordedAt", "dueAt",
    ])
    .where("userId", "=", userId)
}

type DebtRow = Awaited<ReturnType<ReturnType<typeof selectDebts>["execute"]>>[number]

function selectPayments(db: Trx | ReturnType<typeof getDb>, userId: string) {
  return db
    .selectFrom("debtPayments as p")
    .innerJoin("accounts as a", "a.id", "p.accountId")
    .select(["p.id", "p.debtId", "p.amount", "p.accountId", "a.name as accountName", "p.paidAt", "p.paidTime", "p.note"])
    .where("p.userId", "=", userId)
    .orderBy("p.paidAt")
    .orderBy("p.paidTime")
    .orderBy("p.id")
}

type PaymentRow = Awaited<ReturnType<ReturnType<typeof selectPayments>["execute"]>>[number]

function toPayment(row: PaymentRow): DebtPayment {
  return {
    id: row.id, amount: row.amount, accountId: row.accountId, accountName: row.accountName,
    paidAt: row.paidAt,
    // time columns read as "HH:MM:SS"; the app works in "HH:MM".
    paidTime: row.paidTime.slice(0, 5),
    note: row.note ?? undefined,
  }
}

function toDebt(row: DebtRow, payments: DebtPayment[]): Debt {
  const debt: Debt = {
    id: row.id, contactId: row.contactId, accountId: row.accountId ?? undefined,
    recordingMode: row.recordingMode as Debt["recordingMode"],
    direction: row.direction as Debt["direction"], amount: row.amount,
    paidAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
    hasInterest: row.interestRate !== null,
    interestRate: row.interestRate ?? undefined,
    interestPeriod: (row.interestPeriod ?? undefined) as Debt["interestPeriod"],
    note: row.note ?? "", recordedAt: row.recordedAt, dueAt: row.dueAt ?? undefined,
    status: "active", payments,
  }
  debt.status = getPaymentMetrics(debt).remainingAmount === 0 ? "settled" : debt.dueAt && debt.dueAt < todayDate() ? "overdue" : "active"
  return debt
}

export async function getDebts(userId: string): Promise<Debt[]> {
  const db = getDb()
  const [rows, payments] = await Promise.all([
    selectDebts(db, userId).orderBy("recordedAt", "desc").orderBy("id", "desc").execute(),
    selectPayments(db, userId).execute(),
  ])
  const paymentsByDebt = new Map<string, DebtPayment[]>()
  for (const payment of payments) {
    paymentsByDebt.set(payment.debtId, [...(paymentsByDebt.get(payment.debtId) ?? []), toPayment(payment)])
  }
  return rows.map((row) => toDebt(row, paymentsByDebt.get(row.id) ?? []))
}

/** Reads and locks a debt with its payments; concurrent changes to it queue. */
async function lockDebt(trx: Trx, userId: string, debtId: string) {
  const row = await selectDebts(trx, userId).where("id", "=", debtId).forUpdate().executeTakeFirst()
  if (!row) throw new DebtValidationError("Khoản nợ không tồn tại.")
  const payments = await selectPayments(trx, userId).where("p.debtId", "=", debtId).execute()
  return toDebt(row, payments.map(toPayment))
}

export async function createContact(userId: string, input: unknown, operationId: string): Promise<Contact> {
  assertDebtId(operationId)
  const values = parseContact(input)
  const hash = fingerprint("createContact", values)
  return getDb().transaction().execute(async (trx) => {
    // The request id doubles as the contact id, so a retry finds the same row.
    if (await alreadyApplied(trx, userId, operationId, hash)) return getContact(trx, userId, operationId)
    const row = await trx
      .insertInto("contacts")
      .values({
        id: operationId, userId, name: values.name, initials: getInitials(values.name),
        relationship: optional(values.relationship), phone: optional(values.phone), note: optional(values.note),
      })
      .returning(contactColumns)
      .executeTakeFirstOrThrow()
    return toContact(row)
  })
}

export async function updateContact(userId: string, contactId: string, input: unknown): Promise<Contact> {
  assertDebtId(contactId)
  const values = parseContact(input)
  // Avatar initials remain unchanged when editing contact details.
  const row = await getDb()
    .updateTable("contacts")
    .set({ name: values.name, relationship: optional(values.relationship), phone: optional(values.phone), note: optional(values.note) })
    .where("userId", "=", userId)
    .where("id", "=", contactId)
    .returning(contactColumns)
    .executeTakeFirst()
  if (!row) throw new DebtValidationError("Người liên hệ không tồn tại.")
  return toContact(row)
}

export async function deleteContact(userId: string, contactId: string) {
  assertDebtId(contactId)
  await getDb().transaction().execute(async (trx) => {
    const debt = await trx
      .selectFrom("debts")
      .select("id")
      .where("userId", "=", userId)
      .where("contactId", "=", contactId)
      .limit(1)
      .executeTakeFirst()
    if (debt) throw new DebtValidationError("Người này có lịch sử khoản nợ, không thể xoá.")
    await trx.deleteFrom("contacts").where("userId", "=", userId).where("id", "=", contactId).execute()
  })
}

function assertAccount(account: LockedAccount | undefined, allowArchived = false): LockedAccount {
  if (!account || (!allowArchived && account.status !== "active")) throw new DebtValidationError("Tài khoản không tồn tại hoặc đã ngừng sử dụng.")
  return account
}

async function applyBalance(trx: Trx, account: LockedAccount, delta: number) {
  if (delta === 0) return
  const balance = shiftBalance(account.balance, delta)
  // Accounts may go below zero; only the bound either way stops a change.
  if (balance === null) throw new DebtValidationError("Số dư tài khoản vượt giới hạn cho phép.")
  await setBalance(trx, account.id, balance)
  account.balance = balance
}

function debtColumns(values: NewDebt) {
  return {
    contactId: values.contactId, recordingMode: values.recordingMode ?? "cash-flow",
    accountId: values.accountId ?? null, direction: values.direction, amount: values.amount,
    interestRate: values.hasInterest ? values.interestRate ?? null : null,
    interestPeriod: values.hasInterest ? values.interestPeriod ?? null : null,
    // An empty note is stored as NULL.
    note: optional(values.note), recordedAt: values.recordedAt, dueAt: values.dueAt ?? null,
  }
}

/** The loan's own cash movement, shown on the Transactions page. */
function movementColumns(debt: Pick<Debt, "direction" | "amount" | "note" | "recordedAt">, accountId: string) {
  return {
    kind: debt.direction === "borrowed" ? "income" : "expense", amount: debt.amount, accountId,
    note: optional(debt.note), occurredAt: new Date(`${debt.recordedAt}T00:00:00+07:00`),
  }
}

export async function createDebt(userId: string, input: unknown, operationId: string): Promise<Debt> {
  assertDebtId(operationId)
  const values = parseDebt(input)
  const hash = fingerprint("createDebt", values)
  return getDb().transaction().execute(async (trx) => {
    // The request id doubles as the debt id, so a retry finds the same row.
    if (await alreadyApplied(trx, userId, operationId, hash)) return lockDebt(trx, userId, operationId)
    await getContact(trx, userId, values.contactId)
    const account = values.accountId
      ? assertAccount((await lockAccounts(trx, userId, [values.accountId])).get(values.accountId))
      : null
    const debt: Debt = { ...values, id: operationId, status: values.dueAt && values.dueAt < todayDate() ? "overdue" : "active", payments: [] }
    if (getPaymentMetrics(debt).totalAmount > MAX_MONEY) throw new DebtValidationError("Tổng gốc và lãi vượt giới hạn cho phép.")
    await trx.insertInto("debts").values({ id: operationId, userId, ...debtColumns(values) }).execute()
    if (account) {
      await applyBalance(trx, account, values.direction === "lent" ? -values.amount : values.amount)
      await trx.insertInto("transactions").values({ userId, debtId: operationId, ...movementColumns(values, account.id) }).execute()
    }
    return debt
  })
}

export async function saveDebtPayment(userId: string, debtId: string, paymentId: string | undefined, input: unknown | null, operationId: string): Promise<Debt> {
  assertDebtId(debtId)
  assertDebtId(operationId)
  if (paymentId !== undefined) assertDebtId(paymentId)
  if (input === null && !paymentId) throw new DebtValidationError("Thiếu thanh toán cần xoá.")
  const values = input === null ? null : parsePayment(input)
  const hash = fingerprint("saveDebtPayment", { debtId, paymentId, values })
  return getDb().transaction().execute(async (trx) => {
    const debt = await lockDebt(trx, userId, debtId)
    if (await alreadyApplied(trx, userId, operationId, hash)) return debt
    const previous = paymentId ? debt.payments?.find((payment) => payment.id === paymentId) : undefined
    if (paymentId && !previous) throw new DebtValidationError("Thanh toán không còn tồn tại. Vui lòng tải lại trang.")
    const accounts = await lockAccounts(trx, userId, [previous?.accountId, values?.accountId].filter((id): id is string => Boolean(id)))
    // The account a payment already used may since have been archived.
    if (previous?.accountId) assertAccount(accounts.get(previous.accountId), true)
    if (values) assertAccount(accounts.get(values.accountId), values.accountId === previous?.accountId)
    // New payments take the request id, so a retry cannot create a duplicate.
    const savedPaymentId = paymentId ?? operationId
    let updated: Debt
    try {
      updated = updateDebtPayment(debt, paymentId, values && { ...values, accountName: accounts.get(values.accountId)!.name })
    } catch (error) {
      throw new DebtValidationError(error instanceof Error ? error.message : "Thanh toán không hợp lệ.")
    }
    if (!paymentId && values) {
      updated.payments = updated.payments?.map((payment) => debt.payments?.some((old) => old.id === payment.id) ? payment : { ...payment, id: savedPaymentId })
    }
    if (getPaymentMetrics(updated).totalAmount > MAX_MONEY) throw new DebtValidationError("Tổng gốc và lãi vượt giới hạn cho phép.")
    // Collecting (lent) brings money in; repaying (borrowed) sends it out.
    const sign = debt.direction === "lent" ? 1 : -1
    for (const account of accounts.values()) {
      const delta = (values?.accountId === account.id ? sign * values.amount : 0) - (previous?.accountId === account.id ? sign * previous.amount : 0)
      if (account.status !== "active" && values?.accountId === account.id && delta !== 0) {
        throw new DebtValidationError("Tài khoản đã ngừng sử dụng. Hãy chọn tài khoản đang sử dụng để thanh toán.")
      }
      await applyBalance(trx, account, delta)
    }
    if (values) {
      const columns = { accountId: values.accountId, amount: values.amount, paidAt: values.paidAt, paidTime: values.paidTime ?? "00:00", note: optional(values.note) }
      if (previous) await trx.updateTable("debtPayments").set(columns).where("id", "=", savedPaymentId).execute()
      else await trx.insertInto("debtPayments").values({ id: savedPaymentId, userId, debtId, ...columns }).execute()
    } else {
      await trx.deleteFrom("debtPayments").where("id", "=", savedPaymentId).execute()
    }
    return updated
  })
}

// Apply the original cash movement and all repayments as one atomic correction.
export async function changeDebt(userId: string, debtId: string, input: unknown | null, operationId: string): Promise<void> {
  assertDebtId(debtId)
  assertDebtId(operationId)
  const values = input === null ? null : parseDebt(input)
  const hash = fingerprint("changeDebt", { debtId, values })
  await getDb().transaction().execute(async (trx) => {
    // Checked first: a retried delete finds the debt already gone.
    if (await alreadyApplied(trx, userId, operationId, hash)) return
    const debt = await lockDebt(trx, userId, debtId)
    const payments = debt.payments ?? []
    if (values) {
      if (values.recordingMode !== debt.recordingMode) throw new DebtValidationError("Không thể đổi cách ghi nhận của khoản nợ đã tạo.")
      if (payments.length && values.direction !== debt.direction) throw new DebtValidationError("Khoản nợ đã có thanh toán nên không thể đổi giữa đi vay và cho vay.")
      if (payments.some((payment) => payment.paidAt < values.recordedAt)) throw new DebtValidationError("Ngày ghi không được sau ngày thanh toán đầu tiên.")
      let updated: Debt
      try {
        updated = updateDebtPayment({ ...debt, ...values, paidAmount: debt.paidAmount }, undefined, null)
      } catch (error) {
        throw new DebtValidationError(error instanceof Error ? error.message : "Lịch sử thanh toán không hợp lệ.")
      }
      if (getPaymentMetrics(updated).totalAmount > MAX_MONEY) throw new DebtValidationError("Tổng gốc và lãi vượt giới hạn cho phép.")
      await getContact(trx, userId, values.contactId)
    }
    // Undo the old principal movement, then apply the new one (edit) or undo
    // every payment too (delete).
    const deltas = new Map<string, number>()
    const add = (id: string | undefined, delta: number) => {
      if (!id) throw new DebtValidationError("Khoản nợ thiếu thông tin tài khoản để điều chỉnh số dư.")
      deltas.set(id, (deltas.get(id) ?? 0) + delta)
    }
    const sign = debt.direction === "borrowed" ? 1 : -1
    if (debt.recordingMode !== "opening") add(debt.accountId, -sign * debt.amount)
    if (values) {
      if (values.recordingMode !== "opening") add(values.accountId, (values.direction === "borrowed" ? 1 : -1) * values.amount)
    } else for (const payment of payments) add(payment.accountId, sign * payment.amount)
    const accounts = await lockAccounts(trx, userId, deltas.keys())
    for (const [id, delta] of deltas) {
      const isSelectedAccount = values?.accountId === id
      const account = assertAccount(accounts.get(id), !isSelectedAccount || id === debt.accountId)
      if (account.status !== "active" && isSelectedAccount && delta !== 0) {
        throw new DebtValidationError("Tài khoản đã ngừng sử dụng. Hãy chọn tài khoản đang sử dụng cho khoản nợ.")
      }
      await applyBalance(trx, account, delta)
    }
    if (values) {
      await trx.updateTable("debts").set(debtColumns(values)).where("id", "=", debtId).execute()
      if (values.recordingMode !== "opening") {
        const movement = movementColumns(values, values.accountId!)
        await trx
          .insertInto("transactions")
          .values({ userId, debtId, ...movement })
          .onConflict((conflict) => conflict.column("debtId").doUpdateSet(movement))
          .execute()
      }
    } else {
      // Cascades to the payments and the loan's cash movement.
      await trx.deleteFrom("debts").where("id", "=", debtId).execute()
    }
  })
}
