import { SettingsRow } from "@/components/settings-list"
import { categoryColorOptions } from "@/lib/categories/category-colors"
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

// Rose reads as money owed, slate as nothing chosen: neither marks a person.
const contactColors = categoryColorOptions.filter((color) => color.name !== "rose" && color.name !== "slate")

/** A colour of the category palette per person (FNV-1a of the id), the same on every visit. */
function contactColor(contactId: string) {
  let hash = 2_166_136_261
  for (const char of contactId) hash = Math.imul(hash ^ char.charCodeAt(0), 16_777_619) >>> 0
  return contactColors[hash % contactColors.length].surfaceClassName
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
      // The person's initials on a round tile, the size of the rows' icons.
      media={
        <span
          aria-hidden="true"
          className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium", contactColor(contact.id))}
        >
          {contact.initials}
        </span>
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
