"use client"

import { CardLabel } from "@/components/app/card-label"
import { LimitBar } from "@/components/app/limit-bar"
import { Money } from "@/components/app/money"
import {
  budgetPace,
  budgetPaceLabel,
  budgetPercent,
  daysLeft,
  limitTone,
  monthShare,
  perDay,
} from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

/**
 * The whole month's limit, as the overview card and the limits sheet lead
 * with it: what is left to spend large, the share used and of how much on
 * the right, the plain bar (amber when spending runs ahead of the month),
 * then the pace and what is left a day. Past the limit, how far instead.
 */
export function BudgetTotal({ overview, compact = false }: { overview: BudgetOverview; compact?: boolean }) {
  const { spent, limit } = overview.total
  if (limit === null) return null
  const over = spent > limit
  const pace = budgetPace(spent, limit, monthShare(overview))

  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <CardLabel as="span">{over ? "Đã vượt hạn mức" : "Còn được chi"}</CardLabel>
          <Money amount={Math.abs(limit - spent)} size={compact ? "lg" : "xl"} tone={over ? "expense" : "default"} className="mt-1" />
        </span>
        <span className="flex shrink-0 flex-col items-end pb-1">
          <span className="text-sm font-semibold tabular-nums">{budgetPercent(spent, limit)}%</span>
          <span className="text-xs text-muted-foreground tabular-nums">của {formatCompactCurrency(limit, 1)}</span>
        </span>
      </div>
      <LimitBar
        value={spent}
        max={limit}
        tone={limitTone(spent, limit, monthShare(overview))}
        size="md"
        label="Hạn mức tháng đã dùng"
        className={compact ? "mt-3.5" : "mt-4.5"}
      />
      <p className="mt-2.5 text-xs text-muted-foreground">
        {over ? (
          <span className="tabular-nums">
            Đã chi {formatCompactCurrency(spent, 1)} / {formatCompactCurrency(limit, 1)}
          </span>
        ) : (
          <>
            <span className={cn("font-medium", pace === "fast" && "text-warning")}>{budgetPaceLabel[pace]}</span>
            <span className="tabular-nums"> · còn {formatCompactCurrency(perDay(spent, limit, daysLeft(overview)))}/ngày</span>
          </>
        )}
      </p>
    </div>
  )
}
