import { SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import { getDueProjection } from "../_lib/debt-payments"
import { getDebtDeadline, getDebtMetrics } from "../_lib/debt-presentation"
import type { Contact, Debt } from "../_types/debt"

type DebtListItemProps = {
  contact: Contact
  debt: Debt
  /** Highlights the debt shown in the side panel. */
  active: boolean
  onSelect: () => void
}

/** What a row says under the amount: the deadline, else how much is paid. */
function getDebtStatus(debt: Debt) {
  const { remainingAmount, paymentProgress } = getDebtMetrics(debt)

  if (debt.status === "settled" || remainingAmount <= 0) {
    return { label: "Đã tất toán", isOverdue: false, isSettled: true }
  }

  if (debt.dueAt) {
    return { ...getDebtDeadline(debt), isSettled: false }
  }

  const paidLabel = debt.direction === "lent" ? "Đã thu" : "Đã trả"

  return {
    label: paymentProgress > 0 ? `${paidLabel} ${Math.round(paymentProgress)}%` : "Không hạn trả",
    isOverdue: false,
    isSettled: false,
  }
}

export function DebtListItem({ contact, debt, active, onSelect }: DebtListItemProps) {
  const { remainingAmount, totalAmount, paidAmount } = getDebtMetrics(debt)
  // With interest and a due date ahead: what it will come to then.
  const projection = getDueProjection(debt, paidAmount)
  const status = getDebtStatus(debt)
  const amount = formatCurrency(status.isSettled ? totalAmount : remainingAmount, {
    signDisplay: "never",
  })

  return (
    <SettingsRow
      media={
        <Avatar>
          <AvatarFallback>{contact.initials}</AvatarFallback>
        </Avatar>
      }
      title={contact.name}
      // The rate shows on open debts, so a loan with interest reads apart.
      description={
        [
          debt.note,
          projection
            ? `Đến hạn: ${formatCompactCurrency(projection.remainingAmount, 1)}`
            : debt.hasInterest && !status.isSettled
              ? `Lãi ${debt.interestRate}%/${debt.interestPeriod === "year" ? "năm" : "tháng"}`
              : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined
      }
      action={
        <span className="flex flex-col items-end">
          <span
            className={cn(
              "font-heading text-sm font-extrabold tabular-nums",
              status.isSettled && "text-muted-foreground",
            )}
          >
            {amount}
          </span>
          <span
            className={cn(
              "text-xs text-muted-foreground",
              status.isOverdue && "text-[#c8393a] dark:text-[#ff9b93]",
            )}
          >
            {status.label}
          </span>
        </span>
      }
      onClick={onSelect}
      active={active}
    />
  )
}
