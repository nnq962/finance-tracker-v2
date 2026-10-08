import { toDateKey } from "@/lib/format-date"
import { randomId } from "@/lib/random-id"

import type { Debt, DebtPayment, NewDebtPayment } from "./types"

/** Today in Vietnam time, as "YYYY-MM-DD". */
export function todayDate() {
  return toDateKey(new Date())
}

export function getInterest(debt: Debt, date: string) {
  const days = Math.max(0, Math.round((Date.parse(date) - Date.parse(debt.recordedAt)) / 86_400_000))
  const rate = debt.hasInterest ? Math.max(0, debt.interestRate ?? 0) : 0
  const interestAmount = Math.round(debt.amount * rate / 100 * days / (debt.interestPeriod === "year" ? 365 : 30))
  return { days, interestAmount, totalAmount: debt.amount + interestAmount }
}

/**
 * What an open debt with interest will come to on its due date, less what
 * is already paid: interest keeps accruing by the day until then. None once
 * settled, without interest or a due date, or when the due date has passed.
 */
export function getDueProjection(debt: Debt, paidAmount: number, today = todayDate()) {
  if (!debt.hasInterest || !debt.dueAt || debt.dueAt <= today || debt.status === "settled") return null
  const { days, interestAmount, totalAmount } = getInterest(debt, debt.dueAt)
  return { dueAt: debt.dueAt, days, interestAmount, totalAmount, remainingAmount: Math.max(0, totalAmount - paidAmount) }
}

// Older records can contain an opening paid amount without payment history.
export function getOpeningPaidAmount(debt: Debt) {
  return Math.max(0, debt.paidAmount - (debt.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0))
}

export function getPaymentMetrics(debt: Debt, date = todayDate()) {
  if (debt.payments === undefined && debt.status === "settled") {
    const totalAmount = Math.max(debt.amount, debt.paidAmount)
    const interestAmount = Math.max(0, totalAmount - debt.amount)
    // Settled with no payments to date it: the interest it closed with says
    // how many days ran, so they are not counted on to today.
    const perDay = debt.hasInterest ? (debt.amount * Math.max(0, debt.interestRate ?? 0)) / 100 / (debt.interestPeriod === "year" ? 365 : 30) : 0
    const days = perDay > 0 ? Math.round(interestAmount / perDay) : 0

    return {
      days,
      interestAmount,
      interestDate: new Date(Date.parse(debt.recordedAt) + days * 86_400_000).toISOString().slice(0, 10),
      totalAmount,
      paidAmount: debt.paidAmount,
      remainingAmount: 0,
      paymentProgress: 100,
    }
  }

  let paidAmount = getOpeningPaidAmount(debt)
  let interestDate = date
  const payments = [...(debt.payments ?? [])].sort((a, b) => `${a.paidAt}T${a.paidTime ?? "00:00"}`.localeCompare(`${b.paidAt}T${b.paidTime ?? "00:00"}`))
  for (const payment of payments) {
    if (payment.paidAt > date) continue
    paidAmount += payment.amount
    if (paidAmount >= getInterest(debt, payment.paidAt).totalAmount) {
      interestDate = payment.paidAt
      break
    }
  }
  const interest = getInterest(debt, interestDate)
  const remainingAmount = Math.max(interest.totalAmount - paidAmount, 0)
  return {
    ...interest,
    interestDate,
    paidAmount,
    remainingAmount,
    paymentProgress: interest.totalAmount > 0 ? Math.min(100, paidAmount / interest.totalAmount * 100) : 0,
  }
}

export function updateDebtPayment(debt: Debt, paymentId: string | undefined, values: NewDebtPayment | null): Debt {
  if (paymentId && !debt.payments?.some((payment) => payment.id === paymentId)) throw new Error("Không tìm thấy thanh toán cần cập nhật.")
  const payments: DebtPayment[] = (debt.payments ?? []).filter((payment) => payment.id !== paymentId)
  if (values) {
    if (!values.accountId) throw new Error("Vui lòng chọn tài khoản.")
    if (!Number.isSafeInteger(values.amount) || values.amount <= 0) throw new Error("Số tiền phải là số nguyên lớn hơn 0.")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.paidAt) || !Number.isFinite(Date.parse(values.paidAt)) || new Date(values.paidAt).toISOString().slice(0, 10) !== values.paidAt || values.paidAt < debt.recordedAt || values.paidAt > todayDate()) throw new Error("Ngày thanh toán phải từ ngày ghi khoản nợ đến hôm nay.")
    payments.push({ ...values, id: paymentId ?? randomId() })
  }
  payments.sort((a, b) => `${a.paidAt}T${a.paidTime ?? "00:00"}`.localeCompare(`${b.paidAt}T${b.paidTime ?? "00:00"}`))
  let paidAmount = getOpeningPaidAmount(debt)
  let settled = false
  for (const payment of payments) {
    const total = getInterest(debt, payment.paidAt).totalAmount
    if (settled || paidAmount + payment.amount > total) throw new Error("Thay đổi này khiến thanh toán vượt số còn lại tại ngày ghi nhận. Hãy kiểm tra các lần thanh toán sau đó.")
    paidAmount += payment.amount
    settled = paidAmount >= total
  }
  return { ...debt, payments, paidAmount, status: settled ? "settled" : debt.dueAt && debt.dueAt < todayDate() ? "overdue" : "active" }
}
