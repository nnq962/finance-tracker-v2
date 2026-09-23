import type { Debt, DebtPayment, NewDebtPayment } from "./types"

export function todayDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

export function getInterest(debt: Debt, date: string) {
  const days = Math.max(0, Math.round((Date.parse(date) - Date.parse(debt.recordedAt)) / 86_400_000))
  const rate = debt.hasInterest ? Math.max(0, debt.interestRate ?? 0) : 0
  const interestAmount = Math.round(debt.amount * rate / 100 * days / (debt.interestPeriod === "year" ? 365 : 30))
  return { days, interestAmount, totalAmount: debt.amount + interestAmount }
}

// Older records can contain an opening paid amount without payment history.
export function getOpeningPaidAmount(debt: Debt) {
  return Math.max(0, debt.paidAmount - (debt.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0))
}

export function getPaymentMetrics(debt: Debt, date = todayDate()) {
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
    payments.push({ ...values, id: paymentId ?? crypto.randomUUID() })
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
