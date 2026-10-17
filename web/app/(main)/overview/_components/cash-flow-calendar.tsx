"use client"

import * as React from "react"
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react"
import { useReducedMotion } from "motion/react"
import { toast } from "sonner"

import { FlowTiles } from "@/components/app/flow-tiles"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { formatDayLabel } from "@/lib/format-date"
import type { DayTotals } from "@/lib/overview/month-data"
import { summarizeFigures, type Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { TransactionItem } from "../../transactions/_components/transaction-item"
import { cashFlowColors } from "../../transactions/_lib/transaction-presentation"
import { getDayTransactionsAction } from "../actions"

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

// Tiny on a phone-sized card, where seven days share the width; larger once
// the card is wide (32rem and up).
const amountClassName = "text-[10px] font-medium tabular-nums @lg:text-xs"

/**
 * A day's amount, short: from a million up always with one decimal (17,6tr,
 * not 18tr: the shared short form rounds from 10 up to save room, which made
 * a 17.600.000đ income read 18tr, 2026-10-17); below that in thousands (450k).
 */
function formatDayAmount(value: number) {
  if (value >= 1_000_000_000) return `${Number((value / 1_000_000_000).toFixed(1)).toLocaleString("vi-VN")}tỷ`
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1)).toLocaleString("vi-VN")}tr`
  return formatCompactCurrency(value)
}

export function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, monthIndex - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/**
 * One month's days, Monday first, each with what came in and went out. Days
 * up to today open their sheet through `onOpenDay`; without it (a month
 * sliding away) nothing is a button and the grid is hidden from screen readers.
 */
const MonthDays = React.memo(function MonthDays({
  month,
  days,
  today,
  onOpenDay,
  className,
  onAnimationEnd,
}: {
  month: string
  days: Record<string, DayTotals>
  today: string
  onOpenDay?: (key: string) => void
  className?: string
  onAnimationEnd?: () => void
}) {
  const [year, monthNumber] = month.split("-").map(Number)
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  // Monday-first: getUTCDay() is 0 for Sunday.
  const leadingBlanks = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7

  return (
    <div
      className={cn("grid grid-cols-7 gap-1 text-center", className)}
      aria-hidden={onOpenDay ? undefined : true}
      // Only the grid's own slide, not one bubbling up from inside it.
      onAnimationEnd={onAnimationEnd ? (event) => { if (event.target === event.currentTarget) onAnimationEnd() } : undefined}
    >
      {Array.from({ length: leadingBlanks }, (_, index) => (
        <span key={`blank-${index}`} aria-hidden="true" />
      ))}
      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1
        const key = `${month}-${String(day).padStart(2, "0")}`
        const totals = days[key]
        const isToday = key === today
        const content = (
          <>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-sm",
                isToday && "bg-primary font-medium text-primary-foreground",
                key > today && "text-muted-foreground",
              )}
            >
              {day}
            </span>
            {totals?.income ? (
              <span className={cn(amountClassName, cashFlowColors.income.text)}>
                +{formatDayAmount(totals.income)}
              </span>
            ) : null}
            {/* Spending in grey: the minus says it, and red is kept for warnings. */}
            {totals?.expense ? (
              <span className={cn(amountClassName, "text-muted-foreground")}>
                −{formatDayAmount(totals.expense)}
              </span>
            ) : null}
          </>
        )
        const cellClassName =
          "flex min-h-14 min-w-0 flex-col items-center gap-0.5 rounded-2xl pt-1 @lg:min-h-20 @lg:pt-2"

        // Every day up to today opens its sheet, also one without transactions.
        return onOpenDay && key <= today ? (
          <button
            key={key}
            type="button"
            className={cn(
              cellClassName,
              "outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 active:bg-muted",
            )}
            aria-label={
              totals?.income || totals?.expense
                ? `Ngày ${day}: thu ${formatCurrency(totals.income)}, chi ${formatCurrency(totals.expense)}`
                : totals
                  ? `Ngày ${day}: không có thu chi`
                  : `Ngày ${day}: chưa có giao dịch`
            }
            onClick={() => onOpenDay(key)}
          >
            {content}
          </button>
        ) : (
          <div key={key} className={cellClassName}>
            {content}
          </div>
        )
      })}
    </div>
  )
})

type CashFlowCalendarProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  /** Totals per Vietnam day ("YYYY-MM-DD"), summed on the server. */
  days: Record<string, DayTotals>
  /** "YYYY-MM-DD" in Vietnam time. */
  today: string
  /** The month shown, "YYYY-MM"; its title and arrows are around the card. */
  month: string
}

/** A month of days, each with what came in and went out; a day opens its transactions. */
export function CashFlowCalendar({
  accounts,
  categoryGroups,
  days,
  today,
  month,
}: CashFlowCalendarProps) {
  const [openDay, setOpenDay] = React.useState<string | null>(null)
  const reduceMotion = useReducedMotion()
  // A new month's days slide in from the side its arrow points to while the
  // last month's slide out the other way (CSS keyframes in globals.css, run by
  // the browser off the main thread). The leaving month is kept until its
  // slide ends; nothing slides on the first render.
  const [shownMonth, setShownMonth] = React.useState(month)
  const [slide, setSlide] = React.useState<{ from: string; next: boolean } | null>(null)
  if (month !== shownMonth) {
    setShownMonth(month)
    setSlide(reduceMotion ? null : { from: shownMonth, next: month > shownMonth })
  }
  const openDayOf = React.useCallback((key: string) => setOpenDay(key), [])

  // The open day's transactions, loaded when it opens and again whenever
  // the totals change (an edit or delete in the sheet revalidates the page).
  const [loaded, setLoaded] = React.useState<{ key: string; items: Transaction[] } | null>(null)
  React.useEffect(() => {
    // A day without totals has nothing to load.
    if (!openDay || !days[openDay]) return
    let cancelled = false
    void getDayTransactionsAction(openDay).then((result) => {
      if (cancelled) return
      if (result.success) setLoaded({ key: openDay, items: result.data })
      else toast.error(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [openDay, days])
  const dayItems = openDay && !days[openDay] ? [] : loaded && loaded.key === openDay ? loaded.items : null
  // How many rows each half adds up, once they are here, counted as the
  // figures are (a fee or a loan's interest is a row; loans are not).
  const dayFigures = dayItems ? summarizeFigures(dayItems) : null
  const dayCaption = (kind: "income" | "expense") =>
    dayFigures ? `${kind === "income" ? dayFigures.incomeCount : dayFigures.expenseCount} giao dịch` : "Đang tải…"

  const [year, monthNumber] = month.split("-").map(Number)

  const openTotals = openDay ? (days[openDay] ?? { income: 0, expense: 0 }) : undefined
  // Keeps the last day's title while the sheet slides closed.
  const [shownDay, setShownDay] = React.useState(openDay)
  if (openDay && openDay !== shownDay) setShownDay(openDay)
  const sheetTitle = shownDay ? formatDayLabel(shownDay, today) : ""

  return (
    <Card
      size="lg"
      // The days sliding between months are clipped at the card's edge.
      className="overflow-hidden"
      role="region"
      aria-label={`Lịch thu chi tháng ${monthNumber}, ${year}`}
    >
      {/* A container, so the days grow with the card rather than the screen. */}
      <CardContent className="@container space-y-5">
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((weekday) => (
              <span key={weekday} className="pb-1 text-[11px] text-muted-foreground">
                {weekday}
              </span>
            ))}
          </div>
          {/* The weekdays stay; the days slide. The leaving month is laid
              over the new one, so the card takes the new one's height. */}
          <div className="relative">
            {slide ? (
              <MonthDays
                key={`leaving-${slide.from}`}
                month={slide.from}
                days={days}
                today={today}
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0",
                  slide.next ? "animate-month-out-next" : "animate-month-out-prev",
                )}
                onAnimationEnd={() => setSlide(null)}
              />
            ) : null}
            <MonthDays
              key={month}
              month={month}
              days={days}
              today={today}
              onOpenDay={openDayOf}
              className={slide ? (slide.next ? "animate-month-in-next" : "animate-month-in-prev") : undefined}
            />
          </div>
        </div>

        <PageSheet
          title={sheetTitle}
          open={openTotals !== undefined}
          onOpenChange={(open) => { if (!open) setOpenDay(null) }}
          className="gap-6"
        >
          {openTotals ? (
            <>
              {/* The day's money in and out as the transactions page shows a month's. */}
              <FlowTiles
                tiles={[
                  {
                    value: "income",
                    label: "Thu",
                    amount: openTotals.income,
                    caption: dayCaption("income"),
                    icon: ArrowDownLeftIcon,
                    tone: "income",
                  },
                  {
                    value: "expense",
                    label: "Chi",
                    amount: openTotals.expense,
                    caption: dayCaption("expense"),
                    icon: ArrowUpRightIcon,
                    tone: "expense",
                  },
                ]}
              />
              {dayItems && dayItems.length === 0 ? (
                <p className="px-4 text-sm text-muted-foreground">Chưa có giao dịch</p>
              ) : dayItems ? (
                <SettingsGroup title={`${dayItems.length} giao dịch`}>
                  {dayItems.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      accounts={accounts}
                      categoryGroups={categoryGroups}
                      transaction={transaction}
                    />
                  ))}
                </SettingsGroup>
              ) : (
                <div className="space-y-2" role="status" aria-label="Đang tải giao dịch">
                  <Skeleton className="mx-3 h-3 w-24" />
                  <Skeleton className="h-36 w-full" />
                </div>
              )}
            </>
          ) : null}
        </PageSheet>
      </CardContent>
    </Card>
  )
}
