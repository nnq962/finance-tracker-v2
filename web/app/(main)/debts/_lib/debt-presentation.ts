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

export type DebtDeadlineBadge = {
  label: string
  variant: "solid" | "sun" | "outline"
}

/** Badge for list rows: solid when due or overdue, sun within a week. */
export function getDebtDeadlineBadge(debt: Debt): DebtDeadlineBadge {
  const deadline = getDebtDeadline(debt)

  if (deadline.isOverdue) {
    return { label: deadline.label, variant: "solid" }
  }

  if (debt.status !== "settled" && debt.dueAt && getDaysUntilDue(debt.dueAt) <= 7) {
    return { label: deadline.label, variant: "sun" }
  }

  return { label: deadline.label, variant: "outline" }
}

/** Overdue first, then the nearest due date; debts without a due date last. */
export function compareDebtsByUrgency(left: Debt, right: Debt) {
  if (!left.dueAt && !right.dueAt) return right.recordedAt.localeCompare(left.recordedAt)
  if (!left.dueAt) return 1
  if (!right.dueAt) return -1

  return left.dueAt.localeCompare(right.dueAt)
}
