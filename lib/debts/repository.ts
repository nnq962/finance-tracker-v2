import "server-only"

import { createHash } from "node:crypto"
import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin"
import { getPaymentMetrics, todayDate, updateDebtPayment } from "./calculations"
import type { Contact, Debt, DebtPayment } from "./types"
import { assertDebtId, DebtValidationError, MAX_MONEY, parseContact, parseDebt, parsePayment } from "./validation"

function userRef(userId: string) {
  assertDebtId(userId)
  return getFirebaseAdminFirestore().collection("users").doc(userId)
}

function clean<T extends object>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}

function fingerprint(kind: string, input: unknown) {
  return createHash("sha256").update(JSON.stringify({ kind, input })).digest("hex")
}

function verifyOperation(snapshot: FirebaseFirestore.DocumentSnapshot, expected: string) {
  if (!snapshot.exists) return false
  if (snapshot.get("fingerprint") !== expected) throw new DebtValidationError("Yêu cầu này đã được dùng cho một thay đổi khác. Vui lòng thử lại.")
  return true
}

function operationDoc(value: string) {
  return { fingerprint: value, createdAt: FieldValue.serverTimestamp() }
}

function contactFrom(snapshot: FirebaseFirestore.DocumentSnapshot): Contact {
  if (!snapshot.exists) throw new DebtValidationError("Người liên hệ không tồn tại.")
  const data = snapshot.data()!
  return { id: snapshot.id, name: data.name, initials: data.initials, relationship: data.relationship, phone: data.phone, note: data.note }
}

function paymentFrom(snapshot: FirebaseFirestore.DocumentSnapshot): DebtPayment {
  const data = snapshot.data()!
  return { id: snapshot.id, amount: data.amount, accountId: data.accountId, accountName: data.accountName, paidAt: data.paidAt, paidTime: data.paidTime, note: data.note }
}

function debtFrom(snapshot: FirebaseFirestore.DocumentSnapshot, payments: FirebaseFirestore.QuerySnapshot): Debt {
  if (!snapshot.exists) throw new DebtValidationError("Khoản nợ không tồn tại.")
  const data = snapshot.data()!
  const debt: Debt = {
    id: snapshot.id, contactId: data.contactId, accountId: data.accountId,
    direction: data.direction, amount: data.amount, paidAmount: data.paidAmount,
    hasInterest: data.hasInterest, interestRate: data.interestRate, interestPeriod: data.interestPeriod,
    recordedAt: data.recordedAt, dueAt: data.dueAt, status: data.status, note: data.note,
    payments: payments.docs.map(paymentFrom).sort((a, b) => `${a.paidAt}T${a.paidTime}`.localeCompare(`${b.paidAt}T${b.paidTime}`)),
  }
  debt.status = getPaymentMetrics(debt).remainingAmount === 0 ? "settled" : debt.dueAt && debt.dueAt < todayDate() ? "overdue" : "active"
  return debt
}

export async function getContacts(userId: string): Promise<Contact[]> {
  const snapshot = await userRef(userId).collection("contacts").orderBy("createdAt", "asc").get()
  return snapshot.docs.map(contactFrom)
}

export async function getDebts(userId: string): Promise<Debt[]> {
  // One read transaction keeps parent totals and their payment histories consistent.
  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const debts = await transaction.get(userRef(userId).collection("debts").orderBy("recordedAt", "desc"))
    const results: Debt[] = []
    // Read histories concurrently in bounded batches, retaining the transaction
    // snapshot and query order without queuing a request for every debt at once.
    const batchSize = 10
    for (let offset = 0; offset < debts.docs.length; offset += batchSize) {
      const batch = await Promise.all(
        debts.docs.slice(offset, offset + batchSize).map(async (debt) =>
          debtFrom(debt, await transaction.get(debt.ref.collection("payments"))),
        ),
      )
      results.push(...batch)
    }
    return results
  }, { readOnly: true })
}

export async function createContact(userId: string, input: unknown, operationId: string): Promise<Contact> {
  assertDebtId(operationId)
  const values = parseContact(input)
  const user = userRef(userId)
  const reference = user.collection("contacts").doc(operationId)
  const operation = user.collection("debtOperations").doc(operationId)
  const hash = fingerprint("createContact", values)
  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const [op, existing] = await transaction.getAll(operation, reference)
    if (verifyOperation(op, hash)) return contactFrom(existing)
    const initials = values.name.split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi-VN")
    const contact = { ...values, initials }
    transaction.create(reference, { ...clean(contact), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
    transaction.create(operation, operationDoc(hash))
    return { ...contact, id: reference.id }
  })
}

export async function updateContact(userId: string, contactId: string, input: unknown): Promise<Contact> {
  assertDebtId(contactId)
  const values = parseContact(input)
  const reference = userRef(userId).collection("contacts").doc(contactId)
  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const existing = contactFrom(await transaction.get(reference))
    // Avatar initials remain unchanged when editing contact details.
    const contact = { ...existing, ...clean(values) } as Contact
    transaction.update(reference, { ...clean(values), updatedAt: FieldValue.serverTimestamp() })
    return contact
  })
}

export async function deleteContact(userId: string, contactId: string) {
  assertDebtId(contactId)
  const user = userRef(userId)
  const reference = user.collection("contacts").doc(contactId)
  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const existing = await transaction.get(reference)
    if (!existing.exists) return
    const debts = await transaction.get(user.collection("debts").where("contactId", "==", contactId).limit(1))
    if (!debts.empty) throw new DebtValidationError("Người này có lịch sử khoản nợ, không thể xoá.")
    transaction.delete(reference)
  })
}

function assertAccount(snapshot: FirebaseFirestore.DocumentSnapshot, allowArchived = false) {
  if (!snapshot.exists || (!allowArchived && snapshot.get("status") !== "active")) throw new DebtValidationError("Tài khoản không tồn tại hoặc đã ngừng sử dụng.")
  const balance = snapshot.get("balance")
  if (!Number.isSafeInteger(balance) || balance < 0 || balance > MAX_MONEY) throw new DebtValidationError("Số dư tài khoản không hợp lệ.")
  // Existing account migration runs before the debts page becomes available.
  if (!Number.isSafeInteger(snapshot.get("openingBalance"))) throw new DebtValidationError("Vui lòng tải lại trang Tài khoản để hoàn tất cập nhật dữ liệu trước khi tiếp tục.")
  return balance as number
}

function nextBalance(balance: number, delta: number) {
  const result = balance + delta
  if (!Number.isSafeInteger(result) || result < 0 || result > MAX_MONEY) throw new DebtValidationError(delta < 0 ? "Tài khoản không đủ số dư để thực hiện thay đổi này." : "Số dư tài khoản vượt giới hạn cho phép.")
  return result
}

function ledgerDocument(debt: Debt, contactName: string, accountName: string, payment?: DebtPayment) {
  const incoming = payment ? debt.direction === "lent" : debt.direction === "borrowed"
  const label = payment ? incoming ? "Thu nợ" : "Trả nợ" : incoming ? "Đi vay" : "Cho vay"
  return {
    source: "debt", debtId: debt.id,
    ...(payment ? { debtPaymentId: payment.id } : {}),
    kind: incoming ? "income" : "expense",
    amount: payment?.amount ?? debt.amount,
    accountId: payment?.accountId ?? debt.accountId,
    accountIds: [payment?.accountId ?? debt.accountId],
    accountName,
    categoryName: `${label} · ${contactName}`,
    categoryGroupName: "Vay & nợ",
    note: payment?.note ?? debt.note,
    occurredAt: Timestamp.fromDate(new Date(`${payment?.paidAt ?? debt.recordedAt}T${payment?.paidTime ?? "00:00"}:00+07:00`)),
    updatedAt: FieldValue.serverTimestamp(),
  }
}

export async function createDebt(userId: string, input: unknown, operationId: string): Promise<Debt> {
  assertDebtId(operationId)
  const values = parseDebt(input)
  const user = userRef(userId)
  const reference = user.collection("debts").doc(operationId)
  const operation = user.collection("debtOperations").doc(operationId)
  const hash = fingerprint("createDebt", values)
  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const op = await transaction.get(operation)
    if (verifyOperation(op, hash)) return debtFrom(await transaction.get(reference), await transaction.get(reference.collection("payments")))
    const accountReference = user.collection("accounts").doc(values.accountId)
    const [contact, account] = await transaction.getAll(user.collection("contacts").doc(values.contactId), accountReference)
    const person = contactFrom(contact)
    const balance = assertAccount(account)
    const debt: Debt = { ...values, id: reference.id, status: values.dueAt && values.dueAt < todayDate() ? "overdue" : "active", payments: [] }
    if (getPaymentMetrics(debt).totalAmount > MAX_MONEY) throw new DebtValidationError("Tổng gốc và lãi vượt giới hạn cho phép.")
    transaction.create(reference, { ...clean(values), status: debt.status, accountIds: [values.accountId], createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
    transaction.update(accountReference, { balance: nextBalance(balance, values.direction === "lent" ? -values.amount : values.amount), updatedAt: FieldValue.serverTimestamp() })
    transaction.create(user.collection("transactions").doc(`debt_${reference.id}`), {
      ...ledgerDocument(debt, person.name, account.get("name")), createdAt: FieldValue.serverTimestamp(),
    })
    transaction.create(operation, operationDoc(hash))
    return debt
  })
}

export async function saveDebtPayment(userId: string, debtId: string, paymentId: string | undefined, input: unknown | null, operationId: string): Promise<Debt> {
  assertDebtId(debtId)
  assertDebtId(operationId)
  if (paymentId !== undefined) assertDebtId(paymentId)
  if (input === null && !paymentId) throw new DebtValidationError("Thiếu thanh toán cần xoá.")
  const values = input === null ? null : parsePayment(input)
  const user = userRef(userId)
  const reference = user.collection("debts").doc(debtId)
  const operation = user.collection("debtOperations").doc(operationId)
  const hash = fingerprint("saveDebtPayment", { debtId, paymentId, values })
  return getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const op = await transaction.get(operation)
    const debt = debtFrom(await transaction.get(reference), await transaction.get(reference.collection("payments")))
    if (verifyOperation(op, hash)) return debt
    const previous = paymentId ? debt.payments?.find((payment) => payment.id === paymentId) : undefined
    if (paymentId && !previous) throw new DebtValidationError("Thanh toán không còn tồn tại. Vui lòng tải lại trang.")
    const accountIds = [...new Set([previous?.accountId, values?.accountId].filter((id): id is string => Boolean(id)))]
    const snapshots = accountIds.length ? await transaction.getAll(...accountIds.map((id) => user.collection("accounts").doc(id))) : []
    const accounts = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]))
    snapshots.forEach((snapshot) => assertAccount(snapshot, snapshot.id === previous?.accountId))
    const paymentValues = values ? { ...values, accountName: accounts.get(values.accountId)!.get("name") as string } : null
    let updated: Debt
    try {
      updated = updateDebtPayment(debt, paymentId, paymentValues)
    } catch (error) {
      throw new DebtValidationError(error instanceof Error ? error.message : "Thanh toán không hợp lệ.")
    }
    const savedPaymentId = paymentId ?? operationId
    const ledgerReference = user.collection("transactions").doc(`debt_${debtId}_${savedPaymentId}`)
    // Use the stable operation ID for new payments so retries cannot create duplicates.
    if (!paymentId && paymentValues) {
      updated.payments = updated.payments?.map((payment) => debt.payments?.some((old) => old.id === payment.id) ? payment : { ...payment, id: savedPaymentId })
    }
    if (getPaymentMetrics(updated).totalAmount > MAX_MONEY) throw new DebtValidationError("Tổng gốc và lãi vượt giới hạn cho phép.")
    const sign = debt.direction === "lent" ? 1 : -1
    for (const snapshot of snapshots) {
      const delta = (values?.accountId === snapshot.id ? sign * values.amount : 0) - (previous?.accountId === snapshot.id ? sign * previous.amount : 0)
      if (snapshot.get("status") !== "active" && values?.accountId === snapshot.id && delta !== 0) {
        throw new DebtValidationError("Tài khoản đã ngừng sử dụng. Hãy chọn tài khoản đang sử dụng để thanh toán.")
      }
      if (delta !== 0) {
        transaction.update(snapshot.ref, { balance: nextBalance(assertAccount(snapshot, snapshot.id === previous?.accountId), delta), updatedAt: FieldValue.serverTimestamp() })
      }
    }
    const paymentReference = reference.collection("payments").doc(savedPaymentId)
    if (paymentValues) {
      const document = { ...clean(paymentValues), updatedAt: FieldValue.serverTimestamp() }
      if (previous) transaction.update(paymentReference, document)
      else transaction.create(paymentReference, { ...document, createdAt: FieldValue.serverTimestamp() })
    } else transaction.delete(paymentReference)
    // Remove any legacy payment ledger without reversing its balance impact.
    transaction.delete(ledgerReference)
    transaction.update(reference, {
      paidAmount: updated.paidAmount, status: updated.status,
      accountIds: [...new Set([debt.accountId, ...(updated.payments ?? []).map((payment) => payment.accountId)].filter((id): id is string => Boolean(id)))],
      updatedAt: FieldValue.serverTimestamp(),
    })
    transaction.create(operation, operationDoc(hash))
    return updated
  })
}

// Apply the original cash movement and all repayments as one atomic correction.
export async function changeDebt(userId: string, debtId: string, input: unknown | null, operationId: string): Promise<void> {
  assertDebtId(debtId)
  assertDebtId(operationId)
  const values = input === null ? null : parseDebt(input)
  const user = userRef(userId)
  const reference = user.collection("debts").doc(debtId)
  const operation = user.collection("debtOperations").doc(operationId)
  const hash = fingerprint("changeDebt", { debtId, values })
  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    if (verifyOperation(await transaction.get(operation), hash)) return
    const parent = await transaction.get(reference)
    const history = await transaction.get(reference.collection("payments"))
    const debt = debtFrom(parent, history)
    const payments = debt.payments ?? []
    let updated: Debt | null = null
    if (values) {
      if (payments.length && values.direction !== debt.direction) throw new DebtValidationError("Khoản nợ đã có thanh toán nên không thể đổi giữa đi vay và cho vay.")
      if (payments.some((payment) => payment.paidAt < values.recordedAt)) throw new DebtValidationError("Ngày ghi không được sau ngày thanh toán đầu tiên.")
      try {
        updated = updateDebtPayment({ ...debt, ...values, paidAmount: debt.paidAmount }, undefined, null)
      } catch (error) {
        throw new DebtValidationError(error instanceof Error ? error.message : "Lịch sử thanh toán không hợp lệ.")
      }
      if (getPaymentMetrics(updated).totalAmount > MAX_MONEY) throw new DebtValidationError("Tổng gốc và lãi vượt giới hạn cho phép.")
    }
    const deltas = new Map<string, number>()
    const add = (id: string | undefined, delta: number) => {
      if (!id) throw new DebtValidationError("Khoản nợ thiếu thông tin tài khoản để điều chỉnh số dư.")
      deltas.set(id, (deltas.get(id) ?? 0) + delta)
    }
    const sign = debt.direction === "borrowed" ? 1 : -1
    add(debt.accountId, -sign * debt.amount)
    if (values) add(values.accountId, (values.direction === "borrowed" ? 1 : -1) * values.amount)
    else for (const payment of payments) add(payment.accountId, sign * payment.amount)
    const accounts = await transaction.getAll(...[...deltas.keys()].map((id) => user.collection("accounts").doc(id)))
    const person = values ? contactFrom(await transaction.get(user.collection("contacts").doc(values.contactId))) : null
    const ledger = user.collection("transactions").doc(`debt_${debtId}`)
    const oldLedger = await transaction.get(ledger)
    for (const account of accounts) {
      const isSelectedAccount = values?.accountId === account.id
      const allowArchived = !isSelectedAccount || account.id === debt.accountId
      const balance = assertAccount(account, allowArchived)
      const delta = deltas.get(account.id)!
      if (account.get("status") !== "active" && isSelectedAccount && delta !== 0) {
        throw new DebtValidationError("Tài khoản đã ngừng sử dụng. Hãy chọn tài khoản đang sử dụng cho khoản nợ.")
      }
      if (delta !== 0) {
        transaction.update(account.ref, { balance: nextBalance(balance, delta), updatedAt: FieldValue.serverTimestamp() })
      }
    }
    if (updated && values && person) {
      transaction.set(reference, {
        ...clean(values), paidAmount: updated.paidAmount, status: updated.status,
        accountIds: [...new Set([values.accountId, ...payments.map((payment) => payment.accountId)])],
        createdAt: parent.get("createdAt"), updatedAt: FieldValue.serverTimestamp(),
      })
      transaction.set(ledger, {
        ...ledgerDocument(updated, person.name, accounts.find((account) => account.id === values.accountId)!.get("name")),
        createdAt: oldLedger.get("createdAt") ?? FieldValue.serverTimestamp(),
      })
    } else {
      for (const payment of history.docs) {
        transaction.delete(payment.ref)
        transaction.delete(user.collection("transactions").doc(`debt_${debtId}_${payment.id}`))
      }
      transaction.delete(ledger)
      transaction.delete(reference)
    }
    transaction.create(operation, operationDoc(hash))
  })
}
