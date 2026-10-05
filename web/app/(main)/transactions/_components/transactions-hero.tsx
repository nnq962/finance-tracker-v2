"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { DeltaBadge } from "@/components/app/delta-badge"
import { Money } from "@/components/app/money"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { getTransactionSummary } from "../_lib/get-transaction-summary"
import type { Transaction } from "../_types/transaction"

type TransactionsHeroProps = {
  transactions: Transaction[]
  /** The same span of the month before, to show how the figures changed. */
  previousTransactions: Transaction[]
  /** What previousTransactions covers, e.g. "cùng kỳ tháng 9". */
  comparedTo: string
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

function CashFlowStat({
  amount,
  previousAmount,
  comparedTo,
  kind,
}: {
  amount: number
  previousAmount: number
  comparedTo: string
  kind: "income" | "expense"
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {kind === "income" ? "Đã thu" : "Đã chi"}
        <DeltaBadge
          current={amount}
          previous={previousAmount}
          goodWhen={kind === "income" ? "up" : "down"}
          comparedTo={comparedTo}
        />
      </p>
      <Money amount={amount} size="lg" tone={kind} />
    </div>
  )
}

/** The month being viewed, with what came in, went out and the difference. */
export function TransactionsHero({
  transactions,
  previousTransactions,
  comparedTo,
  rangeLabel,
  selectedMonth,
  maxMonth,
  isMonthPending,
  onMonthChange,
}: TransactionsHeroProps) {
  const monthInput = React.useRef<HTMLInputElement>(null)
  const { income, expense, netBalance } = getTransactionSummary(transactions)
  const previous = getTransactionSummary(previousTransactions)

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
      {/* A caption above the card, as on the overview's sections. */}
      <h2
        id="transactions-summary-title"
        className="px-3 text-sm font-medium text-muted-foreground"
      >
        Thu chi trong tháng
      </h2>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
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
                aria-label={`${rangeLabel}, chọn tháng khác`}
                disabled={isMonthPending}
                onClick={openMonthPicker}
              >
                {rangeLabel}
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
              aria-label="Tháng sau"
              disabled={isMonthPending || selectedMonth >= maxMonth}
              onClick={() => onMonthChange(shiftMonth(selectedMonth, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CashFlowStat amount={income} previousAmount={previous.income} comparedTo={comparedTo} kind="income" />
            <CashFlowStat amount={expense} previousAmount={previous.expense} comparedTo={comparedTo} kind="expense" />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Chênh lệch</span>
            <Money
              amount={netBalance}
              size="sm"
              sign={netBalance === 0 ? "auto" : "always"}
              tone={netBalance > 0 ? "income" : netBalance < 0 ? "expense" : "default"}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
