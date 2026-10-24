import type * as React from "react"

import { Money } from "@/components/app/money"
import { SettingsRow } from "@/components/settings-list"
import { formatCompactCurrency } from "@/lib/format-currency"
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
export function getDebtStatus(debt: Debt) {
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

/**
 * The person's avatar with a ring of how much is paid (2026-10-24, the Claude
 * Design handoff): a 1px line 2 off the 36 avatar (42 across), green for a
 * loan given, ink for one taken, on the grey track, from the top clockwise;
 * drawn outside the avatar's box so the row keeps the list's metrics.
 */
function PaidRing({ share, lent, children }: { share: number; lent: boolean; children: React.ReactNode }) {
  const length = 2 * Math.PI * 20.5
  return (
    <span className="relative inline-flex">
      <svg aria-hidden="true" viewBox="0 0 42 42" className="pointer-events-none absolute -inset-[3px] size-[42px] -rotate-90">
        <circle cx="21" cy="21" r="20.5" fill="none" strokeWidth="1" className="stroke-fill-3" />
        {share > 0 ? (
          <circle
            cx="21"
            cy="21"
            r="20.5"
            fill="none"
            strokeWidth="1"
            className={lent ? "stroke-income" : "stroke-foreground"}
            strokeDasharray={`${Math.min(share, 1) * length} ${length}`}
          />
        ) : null}
      </svg>
      {children}
    </span>
  )
}

export function DebtListItem({ contact, debt, active, onSelect }: DebtListItemProps) {
  const { remainingAmount, totalAmount, paidAmount, paymentProgress } = getDebtMetrics(debt)
  // With interest and a due date ahead: what it will come to then.
  const projection = getDueProjection(debt, paidAmount)
  const status = getDebtStatus(debt)
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
      media={
        status.isSettled ? (
          <ContactAvatar contactId={contact.id} initials={contact.initials} />
        ) : (
          <PaidRing share={paymentProgress / 100} lent={debt.direction === "lent"}>
            <ContactAvatar contactId={contact.id} initials={contact.initials} />
          </PaidRing>
        )
      }
      title={contact.name}
      description={[interest, debt.note].filter(Boolean).join(" · ") || undefined}
      action={
        <span className="flex flex-col items-end">
          {/* Signed as everywhere else (2026-10-21): + what is owed to you, in green while open; − what you owe. */}
          <Money
            amount={(debt.direction === "lent" ? 1 : -1) * (status.isSettled ? totalAmount : remainingAmount)}
            sign="always"
            size="sm"
            tone={status.isSettled ? "muted" : debt.direction === "lent" ? "income" : "default"}
          />
          {/* Past due and due today as a soft pill (red, amber), so the eye stops there; the rest grey text (2026-10-24). */}
          <span
            className={cn(
              "text-xs text-muted-foreground",
              status.isOverdue && "mt-0.5 rounded-full px-2 py-px font-semibold",
              status.isOverdue && ("isPastDue" in status && status.isPastDue ? "bg-expense/12 text-destructive-text" : "bg-warning/18 text-warning-text"),
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
