"use client"

import * as React from "react"
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { toast } from "sonner"

import { FlowTiles } from "@/components/app/flow-tiles"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsGroupSkeleton } from "@/components/settings-list"
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

// A new month's days slide in from the side its arrow points to, the old
// ones out the other way, as in Calendar. `transform` rather than `x`, so the
// browser runs the slide on its own (hardware accelerated) and it stays
// smooth while the page is busy with the new month.
const slide = {
  enter: (direction: number) => ({ transform: `translateX(${direction * 48}px)`, opacity: 0 }),
  center: { transform: "translateX(0px)", opacity: 1 },
  // The old month leaves softer and sooner than the new one arrives.
  exit: (direction: number) => ({
    transform: `translateX(${direction * -24}px)`,
    opacity: 0,
    transition: { duration: 0.15, ease: "easeOut" as const },
  }),
}

// Small (11px, the legible floor) on a phone-sized card, where seven days share the width; larger once
// the card is wide (32rem and up).
// The shade of a day by its spending, lightest to heaviest.
const heatClassName = ["bg-foreground/[0.03]", "bg-foreground/[0.05]", "bg-foreground/[0.08]", "bg-foreground/[0.11]"]

const amountClassName = "text-[11px] font-medium tabular-nums @lg:text-xs"

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
  // Which way the month moved: later months come from the right.
  const [shownMonth, setShownMonth] = React.useState(month)
  const [direction, setDirection] = React.useState(1)
  if (month !== shownMonth) {
    setShownMonth(month)
    setDirection(month > shownMonth ? 1 : -1)
  }

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
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  // Monday-first: getUTCDay() is 0 for Sunday.
  const leadingBlanks = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const key = `${month}-${String(index + 1).padStart(2, "0")}`
    return { key, day: index + 1, totals: days[key] }
  })

  // The month's heaviest day of spending so far, for the days' shade.
  const maxExpense = Math.max(0, ...monthDays.filter(({ key }) => key <= today).map(({ totals }) => totals?.expense ?? 0))

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
          {/* The weekdays stay; the days slide. The old month leaves the flow
              as it goes (popLayout), so the card takes the new one's height. */}
          <div className="relative">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={month}
                custom={direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-7 gap-1 text-center"
              >
                {Array.from({ length: leadingBlanks }, (_, index) => (
                  <span key={`blank-${index}`} aria-hidden="true" />
                ))}
                {monthDays.map(({ key, day, totals }) => {
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
                  // Days spent on are shaded by how much, in four steps of the ink
                  // (2026-10-20): heavy days stand out at a glance, and a shaded day
                  // reads as something to tap. Weeks still to come stay shorter.
                  const heat =
                    key <= today && totals?.expense && maxExpense > 0
                      ? heatClassName[Math.min(Math.ceil((totals.expense / maxExpense) * 4), 4) - 1]
                      : undefined
                  const cellClassName = cn(
                    "flex min-w-0 flex-col items-center gap-0.5 rounded-2xl pt-1 @lg:pt-2",
                    key > today ? "min-h-11 @lg:min-h-14" : "min-h-14 @lg:min-h-20",
                    heat,
                  )

                  // Every day up to today opens its sheet, also one without transactions.
                  return key <= today ? (
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
                      onClick={() => setOpenDay(key)}
                    >
                      {content}
                    </button>
                  ) : (
                    <div key={key} className={cellClassName}>
                      {content}
                    </div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
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
                <p className="text-sm text-muted-foreground">Chưa có giao dịch</p>
              ) : dayItems ? (
                <SettingsGroup flat title={`${dayItems.length} giao dịch`}>
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
                  <Skeleton className="h-3 w-24" />
                  <SettingsGroupSkeleton flat caption={false} rows={2} description trailing="amount" />
                </div>
              )}
            </>
          ) : null}
        </PageSheet>
      </CardContent>
    </Card>
  )
}
