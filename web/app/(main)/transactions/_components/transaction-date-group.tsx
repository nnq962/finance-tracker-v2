import { SettingsGroup } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDayLabel, formatShortDate, formatWeekday } from "@/lib/format-date"
import { cn } from "@/lib/utils"

import { TransactionItem } from "./transaction-item"

import { getTransactionSummary } from "../_lib/get-transaction-summary"
import { cashFlowColors } from "../_lib/transaction-presentation"
import type { TransactionDateGroup as TransactionDateGroupModel } from "../_types/transaction"

type TransactionDateGroupProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  group: TransactionDateGroupModel
  /** The day's figures under every filter but the kind; the rows' own otherwise. */
  totals?: { income: number; expense: number }
  /** Today's date key, so today and yesterday read "Hôm nay" and "Hôm qua". */
  todayDateKey: string
  /** The day a bar of the month's chart was tapped for: its badge in ink. */
  focused?: boolean
}

/**
 * One day as its own card (2026-10-24, the Claude Design handoff; flat rows
 * on the page before): the caption, which stays at the top while the day's
 * rows scroll, is the day's number on a badge (today in the lime, the day
 * tapped for in the month's chart in ink), "Hôm nay" / "Hôm qua" / the
 * weekday over the date, and the day's money in less money out (as the
 * month's card counts them) at the end.
 */
export function TransactionDateGroup({
  accounts,
  categoryGroups,
  group,
  totals,
  todayDateKey,
  focused = false,
}: TransactionDateGroupProps) {
  const { income, expense } = totals ?? getTransactionSummary(group.transactions)
  const net = income - expense
  const name = formatDayLabel(group.dateKey, todayDateKey).split(", ")[0]
  const named = group.dateKey === todayDateKey || name === "Hôm qua"
  const isToday = group.dateKey === todayDateKey

  return (
    // Its id is where a bar of the month's chart scrolls to, under the pinned caption.
    <div data-day={group.dateKey} className="scroll-mt-2">
      <SettingsGroup
        stickyCaption
        plainCaption
        title={
          <time dateTime={group.dateKey} className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-[34px] shrink-0 items-center justify-center rounded-[11px] text-[15px] font-bold tabular-nums transition-colors duration-300",
                focused ? "bg-primary text-primary-foreground" : isToday ? "bg-ai text-ai-foreground" : "bg-card",
              )}
            >
              {Number(group.dateKey.slice(8))}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm leading-tight font-semibold">{name}</span>
              <span className="truncate text-xs leading-tight text-muted-foreground">
                {named ? `${formatWeekday(group.dateKey)}, ${formatShortDate(group.dateKey)}` : formatShortDate(group.dateKey)}
              </span>
            </span>
          </time>
        }
        action={
          net !== 0 ? (
            <span className={cn("shrink-0 text-sm font-semibold tabular-nums", net > 0 ? cashFlowColors.income.text : "text-muted-foreground")}>
              {net > 0 ? "+" : "−"}
              {formatCurrency(Math.abs(net), { signDisplay: "never" })}
            </span>
          ) : undefined
        }
      >
        {group.transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            accounts={accounts}
            categoryGroups={categoryGroups}
            transaction={transaction}
          />
        ))}
      </SettingsGroup>
    </div>
  )
}
