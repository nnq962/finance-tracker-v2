"use client"

import { CardLabel } from "@/components/app/card-label"
import { LimitBar } from "@/components/app/limit-bar"
import { Money } from "@/components/app/money"
import {
  budgetPace,
  budgetPaceLabel,
  formatBudgetPercent,
  daysLeft,
  limitTone,
  nearLevel,
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
 * `compact` (Tổng quan's card, 2026-10-19): the figure a size down and
 * everything a step closer.
 */
export function BudgetTotal({ overview, compact = false }: { overview: BudgetOverview; compact?: boolean }) {
  const { spent, limit } = overview.total
  if (limit === null) return null
  const over = spent > limit
  const pace = budgetPace(spent, limit, monthShare(overview))

  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between gap-3">
        {/* A container, so the figure shrinks to its line on a narrow phone rather than breaking mid-number (2026-10-21). */}
        <span className="@container flex min-w-0 flex-1 flex-col">
          <CardLabel as="span">{over ? "Vượt hạn mức" : "Còn lại"}</CardLabel>
          <Money amount={Math.abs(limit - spent)} size={compact ? "lg" : "xl"} fit tone={over ? "expense" : "default"} className={compact ? "mt-0.5" : "mt-1"} />
        </span>
        <span className={cn("flex shrink-0 flex-col items-end", compact ? "pb-0.5" : "pb-1")}>
          {/* "đã dùng", so the share is not read as what is left (2026-10-20). */}
          <span className="text-sm font-semibold tabular-nums">Đã dùng {formatBudgetPercent(spent, limit)}</span>
          <span className="text-xs text-muted-foreground tabular-nums">hạn mức {formatCompactCurrency(limit, 1)}</span>
        </span>
      </div>
      <LimitBar
        value={spent}
        max={limit}
        tone={limitTone(spent, limit, monthShare(overview), nearLevel(overview.alerts))}
        size="md"
        label="Hạn mức tháng đã dùng"
        className={compact ? "mt-3" : "mt-4.5"}
      />
      <p className={cn("text-xs text-pretty text-muted-foreground", compact ? "mt-2" : "mt-2.5")}>
        {over ? (
          <span className="tabular-nums">
            Đã chi {formatCompactCurrency(spent, 1)} / {formatCompactCurrency(limit, 1)}
          </span>
        ) : (
          <>
            <span className={cn("font-medium", pace === "fast" && "text-warning-text")}>{budgetPaceLabel[pace]}</span>
            <span className="tabular-nums"> · còn {formatCompactCurrency(perDay(spent, limit, daysLeft(overview)))} mỗi ngày</span>
          </>
        )}
      </p>
    </div>
  )
}

/**
 * How a month gone by ended, in the place of BudgetTotal: what was spent
 * large, the share of the limit, the bar, then kept (green, what was left)
 * or over (red, by how much). Without `limit` (a month before it was set):
 * what was spent, and "Chưa đặt hạn mức trong tháng này".
 */
export function BudgetResult({ spent, limit, label, near }: { spent: number; limit?: number; label: string; near?: number }) {
  // A month before the limit was set: what was spent, and that there was no limit.
  if (limit === undefined) {
    return (
      <div className="flex flex-col">
        <CardLabel as="span">{label}</CardLabel>
        <Money amount={spent} size="xl" className="mt-1" />
        <p className="mt-2.5 text-xs text-muted-foreground">Chưa đặt hạn mức trong tháng này</p>
      </div>
    )
  }
  const over = spent > limit
  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between gap-3">
        <span className="@container flex min-w-0 flex-1 flex-col">
          <CardLabel as="span">{label}</CardLabel>
          <Money amount={spent} size="xl" fit className="mt-1" />
        </span>
        <span className="flex shrink-0 flex-col items-end pb-1">
          <span className="text-sm font-semibold tabular-nums">{formatBudgetPercent(spent, limit)}</span>
          <span className="text-xs text-muted-foreground tabular-nums">của {formatCompactCurrency(limit, 1)}</span>
        </span>
      </div>
      <LimitBar value={spent} max={limit} tone={limitTone(spent, limit, undefined, near)} size="md" label="Hạn mức đã dùng" className="mt-4.5" />
      <p className={cn("mt-2.5 text-xs font-medium", over ? "text-expense" : "text-income")}>
        {over ? `Vượt hạn mức ${formatCompactCurrency(spent - limit, 1)}` : `Trong hạn mức · còn dư ${formatCompactCurrency(limit - spent, 1)}`}
      </p>
    </div>
  )
}
