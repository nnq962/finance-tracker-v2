import type { Debt } from "../_types/debt"
import { todayDate } from "./debt-payments"

export { formatDate as formatDebtDate } from "@/lib/format-date"

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

/** Overdue first, then the nearest due date; debts without a due date last. */
export function compareDebtsByUrgency(left: Debt, right: Debt) {
  if (!left.dueAt && !right.dueAt) return right.recordedAt.localeCompare(left.recordedAt)
  if (!left.dueAt) return 1
  if (!right.dueAt) return -1

  return left.dueAt.localeCompare(right.dueAt)
}
