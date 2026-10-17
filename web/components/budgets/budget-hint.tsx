"use client"

import * as React from "react"
import { GaugeIcon, TriangleAlertIcon } from "lucide-react"

import { hasLimit, limitTone, monthShare } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

const BudgetContext = React.createContext<BudgetOverview | null>(null)

/** This month's limits for the forms inside (the spending form's hint). */
export function BudgetProvider({ overview, children }: { overview: BudgetOverview | null; children: React.ReactNode }) {
  return <BudgetContext.Provider value={overview}>{children}</BudgetContext.Provider>
}

/** The spending being edited, as the month's figures already count it: taken out before adding the amount typed. */
export type CountedSpending = { groupId?: string; amount: number; month: string }

/**
 * Under the spending form's categories. While the amount typed would take
 * the chosen category's group, or the whole month, past its limit
 * (2026-10-17, "2A"): in red, "Khoản này làm Ăn uống vượt 50k, hạn mức tổng
 * vượt 90k" (it still saves; this only warns). Otherwise what the group has
 * left this month ("Ăn uống còn 580k tháng này", amber from 80% or while
 * running fast). Nothing for another month, spending that does not count
 * (left out, or paid from a jar: `counted` false, then only what is left),
 * a group without a limit and no warning, or outside a BudgetProvider.
 */
export function BudgetHint({
  groupId,
  date,
  amount,
  counted = true,
  editing,
}: {
  groupId?: string
  date: string
  /** The amount typed. */
  amount?: number | null
  /** Whether this spending counts against limits. */
  counted?: boolean
  /** Editing: the spending as saved, already in the figures. */
  editing?: CountedSpending
}) {
  const overview = React.useContext(BudgetContext)
  if (!overview || date.slice(0, 7) !== overview.month) return null
  const group = overview.groups.find((line) => line.groupId === groupId)
  const before = (line: { spent: number }, sameGroup: boolean) =>
    line.spent - (editing && editing.month === overview.month && sameGroup ? editing.amount : 0)
  const added = counted ? (amount ?? 0) : 0

  const groupBefore = group ? before(group, editing?.groupId === groupId) : 0
  const totalBefore = before(overview.total, true)
  const groupOver = group && hasLimit(group) && added > 0 && groupBefore + added > group.limit ? groupBefore + added - group.limit : 0
  const totalOver =
    hasLimit(overview.total) && added > 0 && totalBefore + added > overview.total.limit ? totalBefore + added - overview.total.limit : 0

  if (groupOver || totalOver) {
    const parts = [
      group && groupOver ? `${group.name} vượt ${formatCompactCurrency(groupOver, 1)}` : null,
      totalOver ? `hạn mức tổng vượt ${formatCompactCurrency(totalOver, 1)}` : null,
    ].filter(Boolean)
    return (
      <p role="status" className="flex items-start gap-1.5 px-4 text-xs font-medium text-expense">
        <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        <span>Khoản này làm {parts.join(", ")}</span>
      </p>
    )
  }

  if (!group || !hasLimit(group)) return null
  const state = limitTone(groupBefore, group.limit, monthShare(overview))
  return (
    <p className={cn("flex items-center gap-1.5 px-4 text-xs text-muted-foreground", state === "near" && "text-warning", state === "over" && "text-expense")}>
      <GaugeIcon className="size-3.5 shrink-0" aria-hidden="true" />
      {groupBefore > group.limit
        ? `${group.name} đã vượt hạn mức ${formatCompactCurrency(groupBefore - group.limit, 1)}`
        : `${group.name} còn ${formatCompactCurrency(group.limit - groupBefore, 1)} tháng này`}
    </p>
  )
}
