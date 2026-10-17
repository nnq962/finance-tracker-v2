"use client"

import * as React from "react"
import { ChevronRightIcon, GaugeIcon } from "lucide-react"

import { LimitBar } from "@/components/app/limit-bar"
import { budgetPercent, hasLimit, limitTone, monthShare } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import { BudgetsSheet } from "./budgets-sheet"

/**
 * Under the transactions' Thu / Chi tiles, this month only and with a month
 * limit set: how much of it is used, what is left and the plain bar; a tap
 * opens every limit.
 */
export function BudgetMonthLine({ overview, className }: { overview: BudgetOverview; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const { total } = overview
  if (!hasLimit(total)) return null
  const over = total.spent > total.limit

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-2xl bg-card px-4 text-left shadow-card transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100",
          className,
        )}
      >
        <GaugeIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5 py-2.5">
          <span className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">Đã dùng {budgetPercent(total.spent, total.limit)}% hạn mức tổng</span>
            <span className={cn("shrink-0 text-xs text-muted-foreground tabular-nums", over && "text-expense")}>
              {over ? "vượt" : "còn"} {formatCompactCurrency(Math.abs(total.limit - total.spent), 1)}
            </span>
          </span>
          <LimitBar value={total.spent} max={total.limit} tone={limitTone(total.spent, total.limit, monthShare(overview))} />
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
      <BudgetsSheet overview={overview} open={open} onOpenChange={setOpen} />
    </>
  )
}
