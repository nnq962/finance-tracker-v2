"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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

function CashFlowStat({
  amount,
  kind,
}: {
  amount: number
  kind: "income" | "expense"
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">
        {kind === "income" ? "Đã thu" : "Đã chi"}
      </p>
      <p
        className={cn(
          "font-heading text-xl leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere]",
          cashFlowColors[kind].text,
        )}
      >
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
      {/* A caption above the card, as on the overview's sections. */}
      <h2
        id="transactions-summary-title"
        className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
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
            <CashFlowStat amount={income} kind="income" />
            <CashFlowStat amount={expense} kind="expense" />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Chênh lệch</span>
            <span
              className={cn(
                "font-heading font-extrabold tabular-nums",
                netBalance > 0 && cashFlowColors.income.text,
                netBalance < 0 && cashFlowColors.expense.text,
              )}
            >
              {formatCurrency(netBalance, {
                signDisplay: netBalance === 0 ? "auto" : "always",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
