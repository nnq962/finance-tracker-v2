"use client"

import * as React from "react"
import { GaugeIcon } from "lucide-react"

import { budgetState, hasLimit } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

const BudgetContext = React.createContext<BudgetOverview | null>(null)

/** This month's limits for the forms inside (the spending form's hint). */
export function BudgetProvider({ overview, children }: { overview: BudgetOverview | null; children: React.ReactNode }) {
  return <BudgetContext.Provider value={overview}>{children}</BudgetContext.Provider>
}

/**
 * Under the spending form's categories: what the chosen category's group
 * has left of its limit this month ("Ăn uống còn 580k tháng này", amber from
 * 80%), or how far it is past it, in red. Nothing for a group without a
 * limit, for another month, or outside a BudgetProvider.
 */
export function BudgetHint({ groupId, date }: { groupId?: string; date: string }) {
  const overview = React.useContext(BudgetContext)
  const group = overview?.groups.find((line) => line.groupId === groupId)
  if (!overview || !group || !hasLimit(group) || date.slice(0, 7) !== overview.month) return null

  const state = budgetState(group.spent, group.limit)
  return (
    <p className={cn("flex items-center gap-1.5 px-4 text-xs text-muted-foreground", state === "near" && "text-warning", state === "over" && "text-expense")}>
      <GaugeIcon className="size-3.5 shrink-0" aria-hidden="true" />
      {state === "over"
        ? `${group.name} đã vượt hạn mức ${formatCompactCurrency(group.spent - group.limit, 1)}`
        : `${group.name} còn ${formatCompactCurrency(group.limit - group.spent, 1)} tháng này`}
    </p>
  )
}
