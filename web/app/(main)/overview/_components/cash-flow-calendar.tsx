"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { SettingsGroup } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import type { Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { TransactionItem } from "../../transactions/_components/transaction-item"
import { getTransactionDateKey } from "../../transactions/_lib/get-transaction-period"
import { cashFlowColors } from "../../transactions/_lib/transaction-presentation"

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

const weekdayFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  timeZone: "UTC",
})

type DayTotals = { income: number; expense: number; transactions: Transaction[] }

/** Short amounts that fit a day cell: 460k, 1,2tr, 25tr, 1,5tỷ. */
function compactAmount(value: number) {
  const format = (amount: number, unit: string) =>
    `${Number(amount.toFixed(amount < 10 ? 1 : 0)).toLocaleString("vi-VN")}${unit}`

  if (value >= 1_000_000_000) return format(value / 1_000_000_000, "tỷ")
  if (value >= 1_000_000) return format(value / 1_000_000, "tr")
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return `${value}đ`
}

/** "Hôm nay, 02/10" or "Thứ sáu, 02/10". */
function formatDayTitle(dateKey: string, today: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const weekday = weekdayFormatter.format(new Date(Date.UTC(year, month - 1, day)))
  const label = dateKey === today ? "Hôm nay" : weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${label}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, monthIndex - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

type CashFlowCalendarProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transactions: Transaction[]
  /** "YYYY-MM-DD" in Vietnam time. */
  today: string
  /** Earliest month with loaded transactions, "YYYY-MM". */
  minMonth: string
  /** The month shown, "YYYY-MM"; shared with the allocation chart. */
  month: string
  onMonthChange: (month: string) => void
}

/** A month of days, each with what came in and went out; a day opens its transactions. */
export function CashFlowCalendar({
  accounts,
  categoryGroups,
  transactions,
  today,
  minMonth,
  month,
  onMonthChange,
}: CashFlowCalendarProps) {
  const maxMonth = today.slice(0, 7)
  const [openDay, setOpenDay] = React.useState<string | null>(null)

  // Totals per day, counting income and expenses as the transactions page does.
  const days = React.useMemo(() => {
    const totals = new Map<string, DayTotals>()
    for (const transaction of transactions) {
      const key = getTransactionDateKey(transaction.occurredAt)
      const day = totals.get(key) ?? { income: 0, expense: 0, transactions: [] }
      if (transaction.kind === "income") day.income += Math.abs(transaction.amount)
      if (transaction.kind === "expense") day.expense += Math.abs(transaction.amount)
      day.transactions.push(transaction)
      totals.set(key, day)
    }
    return totals
  }, [transactions])

  const [year, monthNumber] = month.split("-").map(Number)
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  // Monday-first: getUTCDay() is 0 for Sunday.
  const leadingBlanks = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const key = `${month}-${String(index + 1).padStart(2, "0")}`
    return { key, day: index + 1, totals: days.get(key) }
  })
  const monthIncome = monthDays.reduce((sum, day) => sum + (day.totals?.income ?? 0), 0)
  const monthExpense = monthDays.reduce((sum, day) => sum + (day.totals?.expense ?? 0), 0)

  const openTotals = openDay ? days.get(openDay) : undefined
  // Keeps the last day's title while the sheet slides closed.
  const [shownDay, setShownDay] = React.useState(openDay)
  if (openDay && openDay !== shownDay) setShownDay(openDay)
  const sheetTitle = shownDay ? formatDayTitle(shownDay, today) : ""

  return (
    <Card asChild>
      <section aria-label="Lịch thu chi">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tháng trước"
              disabled={month <= minMonth}
              onClick={() => onMonthChange(shiftMonth(month, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <h2 className="font-heading text-sm font-extrabold">
              Tháng {monthNumber}, {year}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tháng sau"
              disabled={month >= maxMonth}
              onClick={() => onMonthChange(shiftMonth(month, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((weekday) => (
              <span key={weekday} className="pb-1 text-xs font-semibold text-muted-foreground">
                {weekday}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden="true" />
            ))}
            {monthDays.map(({ key, day, totals }) => {
              const isToday = key === today
              const content = (
                <>
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday && "bg-[#38b8f6] text-white",
                      key > today && "text-muted-foreground/50",
                    )}
                  >
                    {day}
                  </span>
                  {totals?.income ? (
                    <span className={cn("text-[10px] leading-tight font-bold tabular-nums", cashFlowColors.income.text)}>
                      +{compactAmount(totals.income)}
                    </span>
                  ) : null}
                  {totals?.expense ? (
                    <span className={cn("text-[10px] leading-tight font-bold tabular-nums", cashFlowColors.expense.text)}>
                      −{compactAmount(totals.expense)}
                    </span>
                  ) : null}
                </>
              )
              const cellClassName = "flex min-h-14 min-w-0 flex-col items-center gap-0.5 rounded-lg pt-1"

              // Only days with transactions open a sheet.
              return totals ? (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    cellClassName,
                    "outline-none hover:bg-[#f3f1ec] focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-[#d6f4ff] dark:hover:bg-[#2c2a33] dark:active:bg-[#113950]",
                  )}
                  aria-label={`Ngày ${day}: thu ${formatCurrency(totals.income)}, chi ${formatCurrency(totals.expense)}`}
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
          </div>

          <Separator variant="chunky" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Thu trong tháng</p>
              <p className={cn("font-heading font-extrabold tabular-nums", cashFlowColors.income.text)}>
                {formatCurrency(monthIncome)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Chi trong tháng</p>
              <p className={cn("font-heading font-extrabold tabular-nums", cashFlowColors.expense.text)}>
                {formatCurrency(monthExpense)}
              </p>
            </div>
          </div>

          <Sheet open={openTotals !== undefined} onOpenChange={(open) => { if (!open) setOpenDay(null) }}>
            <SheetContent
              showCloseButton={false}
              aria-describedby={undefined}
              className="gap-0 data-[side=right]:w-full sm:max-w-md!"
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <SheetNavHeader title={sheetTitle} />
              {openTotals ? (
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pt-px pb-4">
                  <div className="grid grid-cols-2 gap-4 px-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Đã thu</p>
                      <p className={cn("font-heading text-lg font-extrabold tabular-nums", cashFlowColors.income.text)}>
                        {formatCurrency(openTotals.income)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Đã chi</p>
                      <p className={cn("font-heading text-lg font-extrabold tabular-nums", cashFlowColors.expense.text)}>
                        {formatCurrency(openTotals.expense)}
                      </p>
                    </div>
                  </div>
                  <SettingsGroup title={`${openTotals.transactions.length} giao dịch`}>
                    {[...openTotals.transactions]
                      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
                      .map((transaction) => (
                        <TransactionItem
                          key={transaction.id}
                          accounts={accounts}
                          categoryGroups={categoryGroups}
                          transaction={transaction}
                        />
                      ))}
                  </SettingsGroup>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </CardContent>
      </section>
    </Card>
  )
}
