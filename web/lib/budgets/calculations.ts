import type { BudgetGroupLine, BudgetLine, BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"

/** ok: under 80%; near: from 80% to the limit; over: past it. */
export type BudgetState = "ok" | "near" | "over"

/** Spent against the share of the month gone, ten points either way counting as on plan. */
export type BudgetPace = "fast" | "slow" | "even"

export function budgetState(spent: number, limit: number): BudgetState {
  if (spent > limit) return "over"
  if (spent >= limit * 0.8) return "near"
  return "ok"
}

/** The days left in the month, today included. */
export function daysLeft(overview: Pick<BudgetOverview, "day" | "daysInMonth">) {
  return overview.daysInMonth - overview.day + 1
}

/** How far the month has gone, today counted as gone (16/31 on the 16th). */
export function monthShare(overview: Pick<BudgetOverview, "day" | "daysInMonth">) {
  return overview.day / overview.daysInMonth
}

export function budgetPace(spent: number, limit: number, share: number): BudgetPace {
  const gap = spent / limit - share
  if (gap > 0.1) return "fast"
  if (gap < -0.1) return "slow"
  return "even"
}

export const budgetPaceLabel: Record<BudgetPace, string> = {
  fast: "Chi nhanh hơn kế hoạch",
  slow: "Chi chậm hơn kế hoạch",
  even: "Đúng kế hoạch",
}

/** What is left for each remaining day, down to the thousand. */
export function perDay(spent: number, limit: number, days: number) {
  return Math.floor(Math.max(limit - spent, 0) / Math.max(days, 1) / 1_000) * 1_000
}

/** Percent of the limit spent, rounded. */
export function budgetPercent(spent: number, limit: number) {
  return Math.round((spent / limit) * 100)
}

/** The suggested limit: the average rounded up to a tidy figure (100k from a million, else 50k). */
export function suggestedLimit(average: number) {
  if (average <= 0) return null
  const step = average >= 1_000_000 ? 100_000 : 50_000
  return Math.ceil(average / step) * step
}

/** Under a group's limit: what is left a day, all of it used, or how far over. */
export function remainingLabel(spent: number, limit: number, days: number) {
  if (spent > limit) return `Vượt ${formatCompactCurrency(spent - limit, 1)}`
  if (spent === limit) return "Đã dùng hết"
  return `Còn ${formatCompactCurrency(limit - spent, 1)} · ${formatCompactCurrency(perDay(spent, limit, days))}/ngày`
}

export function hasLimit<T extends BudgetLine>(line: T): line is T & { budgetId: string; limit: number } {
  return line.budgetId !== null && line.limit !== null
}

/** Whether any limit is set, the whole month's or a group's. */
export function hasAnyBudget(overview: BudgetOverview) {
  return hasLimit(overview.total) || overview.groups.some(hasLimit)
}

/** The groups with a limit, closest to (or furthest past) it first. */
export function groupsByUse(overview: BudgetOverview): (BudgetGroupLine & { budgetId: string; limit: number })[] {
  return overview.groups.filter(hasLimit).sort((a, b) => b.spent / b.limit - a.spent / a.limit)
}

/**
 * The bar's colour: red past the limit; amber from 80%, or for the whole
 * month's limit (`share`, how far the month has gone) when spending runs
 * ahead of plan; else the ink.
 */
export function limitTone(spent: number, limit: number, share?: number): "ok" | "near" | "over" {
  const state = budgetState(spent, limit)
  if (state !== "ok") return state
  return share !== undefined && budgetPace(spent, limit, share) === "fast" ? "near" : "ok"
}
