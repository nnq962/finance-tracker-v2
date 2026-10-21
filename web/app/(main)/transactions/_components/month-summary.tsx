"use client"

import * as React from "react"
import { summarizeFigures } from "@/lib/transactions/types"
import { ArrowDownLeftIcon, ArrowUpRightIcon, ChevronRightIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { LimitBar } from "@/components/app/limit-bar"
import { Money } from "@/components/app/money"
import { BudgetsSheet } from "@/components/budgets/budgets-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBudgetPercent, hasLimit, limitTone, monthShare, nearLevel } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import type { Transaction } from "../_types/transaction"

/**
 * The page's lead card (one card since 2026-10-19, option A of the giao-dich
 * mockup; two tiles and a separate line before; the inverse card, black /
 * white, for the same evening, then the plain card, option E of the
 * lead-card mockup): the month's money in and
 * money out as two columns, figures only (the kind chips above the list
 * narrow it), then, this month and with a month limit set, a hairline and
 * how much of the limit is used with the plain bar; a tap on the card opens
 * every limit (BudgetsSheet). What jars paid is said there, not here.
 * `transactions` are the month's after every filter but the kind, so both
 * figures stay while a kind is chosen. `budgets` null on months gone by.
 */
export function MonthSummary({
  transactions,
  budgets,
  className,
}: {
  transactions: Transaction[]
  budgets: BudgetOverview | null
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  // Counted as the figures are: a transfer's fee and a loan's interest are rows too.
  const totals = summarizeFigures(transactions)
  const limitLine = budgets && hasLimit(budgets.total) ? { overview: budgets, ...budgets.total } : null

  const figures = (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          { label: "Thu", amount: totals.income, count: totals.incomeCount, icon: ArrowDownLeftIcon, tone: "income" },
          { label: "Chi", amount: -totals.expense, count: totals.expenseCount, icon: ArrowUpRightIcon, tone: "expense" },
        ] as const
      ).map((side) => (
        // A container, so the amount fits its column and never breaks across lines.
        <span key={side.label} className="@container flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            {/* The arrow in a small track tile; money in reads in the income green on the plain card. */}
            <span aria-hidden="true" className={cn("flex size-5 items-center justify-center rounded-[6px] bg-fill-1 [&_svg]:size-3", side.tone === "income" && "text-income")}>
              <side.icon />
            </span>
            <CardLabel as="span">{side.label}</CardLabel>
          </span>
          <span className={cn("mt-1.5 flex min-w-0", side.tone === "income" && "text-income")}>
            <Money amount={side.amount} sign={side.amount === 0 ? "never" : "always"} size="lg" fit />
          </span>
          <span className="mt-0.5 text-xs text-muted-foreground">{side.count} giao dịch</span>
        </span>
      ))}
    </div>
  )

  if (!limitLine) {
    return (
      <Card className={className}>
        <CardContent>{figures}</CardContent>
      </Card>
    )
  }

  const { overview, spent, limit } = limitLine
  const over = spent > limit

  return (
    <>
      {/* Only the limit line opens the limits (2026-10-21): a thumb on Thu or Chi read as asking for those. */}
      <Card className={className}>
        <CardContent>
          {figures}
          <div className="mt-4 border-t border-separator pt-1.5" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pressable -mx-2 -mb-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-2xl px-2 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30 active:bg-muted [@media(hover:hover)]:hover:bg-muted"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 text-balance">Đã dùng {formatBudgetPercent(spent, limit)} hạn mức tổng</span>
                <span className={cn("shrink-0 text-xs text-muted-foreground tabular-nums", over && "font-semibold text-expense")}>
                  {over ? "vượt" : "còn"} {formatCompactCurrency(Math.abs(limit - spent), 1)}
                </span>
              </span>
              <LimitBar value={spent} max={limit} tone={limitTone(spent, limit, monthShare(overview), nearLevel(overview.alerts))} label="Hạn mức tháng đã dùng" />
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </CardContent>
      </Card>
      <BudgetsSheet overview={overview} open={open} onOpenChange={setOpen} />
    </>
  )
}

/**
 * The card's footprint for the page's loading screen: the two columns and
 * the limit line, so nothing moves when the page arrives.
 */
export function MonthSummarySkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((index) => (
            <div key={index} className="flex flex-col">
              <div className="flex h-5 items-center gap-2">
                <Skeleton className="size-5 rounded-[6px]" />
                <Skeleton className="h-3.5 w-10" />
              </div>
              <div className="mt-1.5 flex h-7 items-center">
                <Skeleton className="h-6 w-28 max-w-full" />
              </div>
              <div className="mt-0.5 flex h-4 items-center">
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-separator pt-1.5" />
        <div className="-mb-2 flex items-center gap-3 py-2">
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex h-5 items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-3 w-14" />
            </span>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </span>
          <Skeleton className="size-4 shrink-0 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}
