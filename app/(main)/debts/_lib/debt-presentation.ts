import type { Debt } from "../_types/debt"
import { todayDate } from "./debt-payments"

export const dateFormatter = new Intl.DateTimeFormat("vi-VN")

export function formatDebtDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00`))
}

export { getPaymentMetrics as getDebtMetrics } from "./debt-payments"

export function getDaysUntilDue(dueAt: string) {
  return Math.round((Date.parse(dueAt) - Date.parse(todayDate())) / 86_400_000)
}

export function getDebtDeadline(debt: Debt) {
  if (debt.status === "settled") {
    return { label: "Đã tất toán", isOverdue: false }
  }

  if (!debt.dueAt) {
    return { label: "Không có hạn trả", isOverdue: false }
  }

  const daysUntilDue = getDaysUntilDue(debt.dueAt)

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
