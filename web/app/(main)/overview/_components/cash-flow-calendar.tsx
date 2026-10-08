"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { toast } from "sonner"

import { Money } from "@/components/app/money"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { formatDayLabel } from "@/lib/format-date"
import type { DayTotals } from "@/lib/overview/month-data"
import type { Transaction } from "@/lib/transactions/types"
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
  exit: (direction: number) => ({ transform: `translateX(${direction * -48}px)`, opacity: 0 }),
}

// Tiny on a phone-sized card, where seven days share the width; larger once
// the card is wide (32rem and up).
const amountClassName = "text-[10px] font-medium tabular-nums @lg:text-xs"

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

  const [year, monthNumber] = month.split("-").map(Number)
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  // Monday-first: getUTCDay() is 0 for Sunday.
  const leadingBlanks = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const key = `${month}-${String(index + 1).padStart(2, "0")}`
    return { key, day: index + 1, totals: days[key] }
  })

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
                          +{formatCompactCurrency(totals.income)}
                        </span>
                      ) : null}
                      {/* Spending in grey: the minus says it, and red is kept for warnings. */}
                      {totals?.expense ? (
                        <span className={cn(amountClassName, "text-muted-foreground")}>
                          −{formatCompactCurrency(totals.expense)}
                        </span>
                      ) : null}
                    </>
                  )
                  const cellClassName =
                    "flex min-h-14 min-w-0 flex-col items-center gap-0.5 rounded-2xl pt-1 @lg:min-h-20 @lg:pt-2"

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
                        totals
                          ? `Ngày ${day}: thu ${formatCurrency(totals.income)}, chi ${formatCurrency(totals.expense)}`
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
              <div className="grid grid-cols-2 gap-4 px-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Đã thu</p>
                  <Money amount={openTotals.income} size="lg" tone="income" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đã chi</p>
                  <Money amount={openTotals.expense} size="lg" />
                </div>
              </div>
              {dayItems && dayItems.length === 0 ? (
                <p className="px-3 text-sm text-muted-foreground">Chưa có giao dịch</p>
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
