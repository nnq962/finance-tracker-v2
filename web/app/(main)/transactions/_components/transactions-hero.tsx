"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import { getTransactionSummary } from "../_lib/get-transaction-summary"
import { cashFlowColors } from "../_lib/transaction-presentation"
import type { Transaction } from "../_types/transaction"

type TransactionsHeroProps = {
  transactions: Transaction[]
  rangeLabel: string
  /** "YYYY-MM" */
  selectedMonth: string
  maxMonth: string
  isMonthPending: boolean
  onMonthChange: (month: string) => void
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, monthIndex - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

const cashFlowStats = {
  income: { label: "Đã thu", icon: ArrowDownLeftIcon },
  expense: { label: "Đã chi", icon: ArrowUpRightIcon },
} as const

/** A tile in the kind's colour, as the tiles in a banking app's summary. */
function CashFlowStat({
  amount,
  kind,
}: {
  amount: number
  kind: "income" | "expense"
}) {
  const { label, icon: Icon } = cashFlowStats[kind]
  return (
    <div className={cn("min-w-0 rounded-2xl p-3", cashFlowColors[kind].surface)}>
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <span className="flex size-5 items-center justify-center rounded-full bg-white/70 dark:bg-black/20">
          <Icon className="size-3" aria-hidden="true" />
        </span>
        {label}
      </p>
      <p className="mt-2 font-heading text-lg leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere]">
        {formatCurrency(amount)}
      </p>
    </div>
  )
}

/** The month being viewed, with what came in, went out and the difference. */
export function TransactionsHero({
  transactions,
  rangeLabel,
  selectedMonth,
  maxMonth,
  isMonthPending,
  onMonthChange,
}: TransactionsHeroProps) {
  const monthInput = React.useRef<HTMLInputElement>(null)
  const { income, expense, netBalance } = getTransactionSummary(transactions)

  const openMonthPicker = () => {
    const input = monthInput.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <section aria-labelledby="transactions-summary-title" className="space-y-2">
      {/* A caption above the card on desktop, as on the overview's sections.
          Phones have no card: the summary opens the page as in a native app. */}
      <h2
        id="transactions-summary-title"
        className="sr-only px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:not-sr-only"
      >
        Thu chi trong tháng
      </h2>
      <Card className="max-lg:contents">
        <CardContent className="space-y-5 max-lg:px-0">
          {/* The month as a pill, its arrows inside. */}
          <div className="flex items-center justify-between gap-2 rounded-full bg-[#f3f1ec] p-1 dark:bg-[#1b1a21]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Tháng trước"
              disabled={isMonthPending}
              onClick={() => onMonthChange(shiftMonth(selectedMonth, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                aria-label={`${rangeLabel}, chọn tháng khác`}
                disabled={isMonthPending}
                onClick={openMonthPicker}
              >
                {rangeLabel}
                <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
              {/* The native month picker, opened from the label above. */}
              <input
                ref={monthInput}
                type="month"
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                value={selectedMonth}
                max={maxMonth}
                onChange={(event) => {
                  const month = event.target.value
                  if (month && month <= maxMonth && month !== selectedMonth) {
                    onMonthChange(month)
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Tháng sau"
              disabled={isMonthPending || selectedMonth >= maxMonth}
              onClick={() => onMonthChange(shiftMonth(selectedMonth, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          {/* The difference leads, large, as a balance does in a wallet app. */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Chênh lệch</p>
            <p
              className={cn(
                "mt-1 font-heading text-4xl leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere]",
                netBalance > 0 && cashFlowColors.income.text,
                netBalance < 0 && cashFlowColors.expense.text,
              )}
            >
              {formatCurrency(netBalance, {
                signDisplay: netBalance === 0 ? "auto" : "always",
              })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CashFlowStat amount={income} kind="income" />
            <CashFlowStat amount={expense} kind="expense" />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
