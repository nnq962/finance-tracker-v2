"use client"

import * as React from "react"
import { summarizeFigures } from "@/lib/transactions/types"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { LimitBar } from "@/components/app/limit-bar"
import { Money } from "@/components/app/money"
import { MonthSelect } from "@/components/app/month-select"
import { SoftSwap } from "@/components/app/soft-swap"
import { BudgetsSheet } from "@/components/budgets/budgets-sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBudgetPercent, hasLimit, limitTone, monthShare, nearLevel } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { shiftMonthKey } from "@/lib/budgets/months"
import { formatCompactCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import type { Transaction, TransactionSummaryData } from "../_types/transaction"

/**
 * A day of the month as a bar of what was spent (2026-10-24, the handoff):
 * taller for more, a short line for a day with nothing, grey ahead of today;
 * today in the lime, the day tapped in ink. Spending only (money in left
 * the chart 2026-10-24). A day with rows goes to them in the list on a tap.
 */
function DayBars({
  month,
  todayDateKey,
  dayTotals,
  focusDay,
  onDayTap,
}: {
  month: string
  todayDateKey: string
  dayTotals: Record<string, TransactionSummaryData>
  focusDay: string | null
  onDayTap: (dateKey: string) => void
}) {
  const [year, monthNumber] = month.split("-").map(Number)
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const keys = Array.from({ length: days }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`)
  const most = Math.max(1, ...keys.map((key) => dayTotals[key]?.expense ?? 0))

  return (
    <div>
      <div className="flex h-[60px] gap-[3px]">
        {keys.map((key, index) => {
          const totals = dayTotals[key]
          const spent = totals?.expense ?? 0
          const ahead = key > todayDateKey
          return (
            <button
              key={key}
              type="button"
              disabled={!totals}
              aria-label={`Ngày ${index + 1}: chi ${formatCompactCurrency(spent, 1)}`}
              onClick={() => onDayTap(key)}
              className="flex h-full min-w-0 flex-1 flex-col items-center outline-none focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default"
            >
              <span className="flex w-full flex-1 items-end">
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-full rounded-[3px] transition-[background-color,height] duration-300 motion-reduce:transition-none",
                    key === focusDay ? "bg-foreground" : key === todayDateKey ? "bg-ai" : ahead ? "bg-track" : spent ? "bg-chart-neutral" : "bg-separator",
                  )}
                  style={{ height: !ahead && spent ? `${Math.max(6, Math.round((spent / most) * 48))}px` : "3px" }}
                />
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium whitespace-nowrap text-muted-foreground tabular-nums">
        <span>1/{monthNumber}</span>
        <span>
          {days}/{monthNumber}
        </span>
      </div>
    </div>
  )
}

/**
 * The page's lead card (2026-10-24 after the Claude Design handoff, on the
 * design system; one card with two columns since 2026-10-19): the month as a
 * grey pill with ‹ › to step a month, then what went out as the lead figure
 * and what came in beside it, a hairline between, then the month's days as
 * bars (DayBars), then, this month and with a month limit set, a hairline and
 * how much of the limit is used with the plain bar; a tap on that line opens
 * every limit (BudgetsSheet). What jars paid is said there, not here.
 * `transactions` are the month's after every filter but the kind, so both
 * figures stay while a kind is chosen. `budgets` null on months gone by.
 * The figures cross-blur to the next month's (SoftSwap, 2026-10-24).
 */
export function MonthSummary({
  transactions,
  budgets,
  month,
  maxMonth,
  onMonthChange,
  todayDateKey,
  dayTotals,
  focusDay,
  onDayTap,
  className,
}: {
  transactions: Transaction[]
  budgets: BudgetOverview | null
  /** "YYYY-MM", the month shown. */
  month: string
  /** "YYYY-MM", the latest month there is (this one). */
  maxMonth: string
  onMonthChange: (month: string) => void
  todayDateKey: string
  /** Each day's figures under every filter but the kind, as the list's day captions show them. */
  dayTotals: Record<string, TransactionSummaryData>
  focusDay: string | null
  onDayTap: (dateKey: string) => void
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  // Counted as the figures are: a transfer's fee and a loan's interest are rows too.
  const totals = summarizeFigures(transactions)
  const limitLine = budgets && hasLimit(budgets.total) ? { overview: budgets, ...budgets.total } : null

  const head = (
    <div className="flex items-center justify-between gap-3">
      <MonthSelect size="card" value={month} max={maxMonth} onValueChange={onMonthChange} />
      <span className="flex gap-1.5">
        <Button type="button" variant="secondary" size="icon-sm" aria-label="Tháng trước" onClick={() => onMonthChange(shiftMonthKey(month, -1))}>
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label="Tháng sau"
          disabled={month >= maxMonth}
          onClick={() => onMonthChange(shiftMonthKey(month, 1))}
        >
          <ChevronRightIcon />
        </Button>
      </span>
    </div>
  )

  const figures = (
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-3">
      {/* Containers, so each amount fits its column and never breaks across lines. */}
      <span className="@container flex min-w-0 flex-col">
        <CardLabel as="span">
          Đã chi · <SoftSwap value={totals.expenseCount} inline />
        </CardLabel>
        <span className="mt-1 flex min-w-0">
          <SoftSwap value={totals.expense}>{(amount) => <Money amount={amount} sign="never" size="lg" fit />}</SoftSwap>
        </span>
      </span>
      <span aria-hidden="true" className="bg-separator" />
      <span className="@container flex min-w-0 flex-col">
        <CardLabel as="span">
          Đã thu · <SoftSwap value={totals.incomeCount} inline />
        </CardLabel>
        <span className="mt-1 flex min-w-0 text-income">
          <SoftSwap value={totals.income}>{(amount) => <Money amount={amount} sign="never" size="lg" fit />}</SoftSwap>
        </span>
      </span>
    </div>
  )

  const bars = (
    <div className="mt-4">
      <DayBars month={month} todayDateKey={todayDateKey} dayTotals={dayTotals} focusDay={focusDay} onDayTap={onDayTap} />
    </div>
  )

  if (!limitLine) {
    return (
      <Card className={className}>
        <CardContent>
          {head}
          {figures}
          {bars}
        </CardContent>
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
          {head}
          {figures}
          {bars}
          <div className="mt-4 border-t border-separator pt-1.5" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pressable -mx-2 -mb-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30 active:bg-muted [@media(hover:hover)]:hover:bg-muted"
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
 * The card's footprint for the page's loading screen: the month pill and its
 * arrows, the two columns, the day bars and the limit line, so nothing moves
 * when the page arrives.
 */
export function MonthSummarySkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-28 rounded-full" />
          <span className="flex gap-1.5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-3">
          {[0, 1].map((index) => (
            <React.Fragment key={index}>
              {index === 1 ? <span className="bg-separator" /> : null}
              <div className="flex flex-col">
                <div className="flex h-5 items-center">
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <div className="mt-1 flex h-7 items-center">
                  <Skeleton className="h-6 w-28 max-w-full" />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4 flex h-[60px] items-end">
          <Skeleton className="h-[3px] w-full rounded-full" />
        </div>
        <div className="mt-1.5 flex h-[14px] justify-between">
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="h-2.5 w-8" />
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
