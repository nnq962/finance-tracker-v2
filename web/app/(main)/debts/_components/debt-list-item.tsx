import { SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

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
  const { remainingAmount, totalAmount } = getDebtMetrics(debt)
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
      description={debt.note}
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
