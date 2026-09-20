import type { Debt } from "../_types/debt"

export const dateFormatter = new Intl.DateTimeFormat("vi-VN")

export function formatDebtDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00`))
}

export function getDebtMetrics(debt: Debt) {
  const paidAmount = Math.min(Math.max(debt.paidAmount, 0), debt.amount)
  const remainingAmount = Math.max(debt.amount - paidAmount, 0)
  const paymentProgress = debt.amount > 0 ? (paidAmount / debt.amount) * 100 : 0

  return { paidAmount, remainingAmount, paymentProgress }
}

export function getDebtDeadline(debt: Debt) {
  if (debt.status === "settled") {
    return { label: "Đã tất toán", isOverdue: false }
  }

  if (!debt.dueAt) {
    return { label: "Không có hạn trả", isOverdue: false }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDate = new Date(`${debt.dueAt}T00:00:00`)
  const daysUntilDue = Math.round(
    (dueDate.getTime() - today.getTime()) / 86_400_000,
  )

  if (debt.status === "overdue" || daysUntilDue < 0) {
    return {
      label: `Quá ${Math.abs(daysUntilDue)} ngày`,
      isOverdue: true,
    }
  }

  if (daysUntilDue === 0) {
    return { label: "Đến hạn hôm nay", isOverdue: true }
  }

  return { label: `Còn ${daysUntilDue} ngày`, isOverdue: false }
}
