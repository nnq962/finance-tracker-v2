import type { BudgetAlertSettings, BudgetGroupLine, BudgetLine, BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"

/** ok: under the early warning (80% unless set otherwise); near: from it to the limit; over: past it. */
export type BudgetState = "ok" | "near" | "over"

/** Spent against the share of the month gone, ten points either way counting as on plan. */
export type BudgetPace = "fast" | "slow" | "even"

export function budgetState(spent: number, limit: number, near = 80): BudgetState {
  if (spent > limit) return "over"
  if (spent >= (limit * near) / 100) return "near"
  return "ok"
}

/**
 * Where the bars turn amber (2026-10-17): the first push the user chose
 * (80% or 90%); 80% with limit pushes off or no early warning.
 */
export function nearLevel(alerts: BudgetAlertSettings) {
  return alerts.enabled && alerts.level !== null ? alerts.level : 80
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
  fast: "Đang chi nhanh",
  slow: "Chi ít hơn dự kiến",
  even: "Chi vừa phải",
}

/** What is left for each remaining day, down to the thousand. */
export function perDay(spent: number, limit: number, days: number) {
  return Math.floor(Math.max(limit - spent, 0) / Math.max(days, 1) / 1_000) * 1_000
}

/**
 * Percent of the limit spent: rounded down while within it, so 99.5% never
 * reads 100% with money left; up once past it, so past it never reads 100%.
 */
export function budgetPercent(spent: number, limit: number) {
  const percent = (spent / limit) * 100
  return spent > limit ? Math.ceil(percent) : Math.floor(percent)
}

/** The share as shown: ">999%" far past a limit, where the figure says nothing more (2026-10-17: "114654%"). */
export function formatBudgetPercent(spent: number, limit: number) {
  const percent = budgetPercent(spent, limit)
  return percent > 999 ? ">999%" : `${percent}%`
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
  return `Còn ${formatCompactCurrency(limit - spent, 1)} · ${formatCompactCurrency(perDay(spent, limit, days))} mỗi ngày`
}

export function hasLimit<T extends Pick<BudgetLine, "budgetId" | "limit">>(line: T): line is T & { budgetId: string; limit: number } {
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
 * The bar's colour: red past the limit; amber from the early warning
 * (`near`, nearLevel), or while spending runs ahead of the month gone
 * (`share`); else the ink.
 */
export function limitTone(spent: number, limit: number, share?: number, near = 80): "ok" | "near" | "over" {
  const state = budgetState(spent, limit, near)
  if (state !== "ok") return state
  return share !== undefined && budgetPace(spent, limit, share) === "fast" ? "near" : "ok"
}

/**
 * The rule between limits (2026-10-17): the groups' limits together fit in
 * the whole month's, as the month is the ceiling for everything spent (first
 * only a group alone was held to it, the groups adding up to more with a
 * word; the user found 3tr + 3tr + 6tr under a 7tr month makes no sense).
 * Without a month limit there is no rule. `groups` are every group's limit
 * as it will be; `changed` is the group being set (by name) or "total", for
 * the wording. Returns why the limits break the rule, or null.
 */
export function limitsConflict(
  total: number | null,
  groups: { name: string; limit: number }[],
  changed: "total" | string,
): string | null {
  if (total === null) return null
  const shared = groups.reduce((sum, group) => sum + group.limit, 0)
  if (shared <= total) return null
  if (changed === "total") {
    return `Các nhóm đã chia ${formatCompactCurrency(shared, 1)}. Hạn mức tổng cần từ ${formatCompactCurrency(shared, 1)}, hoặc giảm hạn mức nhóm trước.`
  }
  const others = groups.filter((group) => group.name !== changed).reduce((sum, group) => sum + group.limit, 0)
  const left = total - others
  return left > 0
    ? `Hạn mức tổng ${formatCompactCurrency(total, 1)} chỉ còn chia được ${formatCompactCurrency(left, 1)} cho ${changed}.`
    : `Hạn mức tổng ${formatCompactCurrency(total, 1)} đã chia hết cho các nhóm khác.`
}

/** What the whole month's limit still leaves for a group, after the other groups' limits: never below 0. */
export function leftToShare(total: number, otherGroups: number[]) {
  return Math.max(total - otherGroups.reduce((sum, limit) => sum + limit, 0), 0)
}
