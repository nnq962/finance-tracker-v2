import { SettingsRow } from "@/components/settings-list"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import { getDueProjection } from "../_lib/debt-payments"
import { getDebtDeadline, getDebtMetrics } from "../_lib/debt-presentation"
import type { Contact, Debt } from "../_types/debt"
import { ContactAvatar } from "./contact-avatar"

type DebtListItemProps = {
  contact: Contact
  debt: Debt
  /** Highlights the debt shown in the side panel. */
  active: boolean
  onSelect: () => void
}

function getInterestLabel(debt: Debt) {
  return `Lãi ${debt.interestRate}%/${debt.interestPeriod === "year" ? "năm" : "tháng"}`
}

/**
 * What a row says under the amount: the deadline, else how much is paid. A loan
 * with interest that has neither shows its rate there instead of "Không hạn
 * trả", so it reads apart and the description keeps just its note.
 */
function getDebtStatus(debt: Debt) {
  const { remainingAmount, paymentProgress } = getDebtMetrics(debt)

  if (debt.status === "settled" || remainingAmount <= 0) {
    return { label: "Đã tất toán", isOverdue: false, isSettled: true }
  }

  if (debt.dueAt) {
    return { ...getDebtDeadline(debt), isSettled: false }
  }

  if (paymentProgress > 0) {
    const paidLabel = debt.direction === "lent" ? "Đã thu" : "Đã trả"
    return {
      label: `${paidLabel} ${Math.round(paymentProgress)}%`,
      isOverdue: false,
      isSettled: false,
    }
  }

  if (debt.hasInterest) {
    return { label: getInterestLabel(debt), isOverdue: false, isSettled: false, showsRate: true }
  }

  return { label: "Không hạn trả", isOverdue: false, isSettled: false }
}

export function DebtListItem({ contact, debt, active, onSelect }: DebtListItemProps) {
  const { remainingAmount, totalAmount, paidAmount } = getDebtMetrics(debt)
  // With interest and a due date ahead: what it will come to then.
  const projection = getDueProjection(debt, paidAmount)
  const status = getDebtStatus(debt)
  const amount = formatCurrency(status.isSettled ? totalAmount : remainingAmount, {
    signDisplay: "never",
  })
  // Unless the rate already shows on the right, interest goes under the name:
  // what the debt will come to on its due date, else its rate. It leads, as it
  // is short and the note is free text of any length, which the one-line
  // description cuts.
  const interest = projection
    ? `Đến hạn: ${formatCompactCurrency(projection.remainingAmount, 1)}`
    : debt.hasInterest && !status.isSettled && !status.showsRate
      ? getInterestLabel(debt)
      : null

  return (
    <SettingsRow
      media={<ContactAvatar contactId={contact.id} initials={contact.initials} />}
      title={contact.name}
      description={[interest, debt.note].filter(Boolean).join(" · ") || undefined}
      action={
        <span className="flex flex-col items-end">
          <span
            className={cn(
              "text-sm font-medium tabular-nums",
              status.isSettled && "text-muted-foreground",
            )}
          >
            {amount}
          </span>
          <span
            className={cn(
              "text-xs text-muted-foreground",
              status.isOverdue && "text-expense",
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
