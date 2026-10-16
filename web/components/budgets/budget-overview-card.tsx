"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { LimitBar } from "@/components/app/limit-bar"
import { Section } from "@/components/app/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { budgetPercent, budgetState, groupsByUse, hasAnyBudget, hasLimit, limitTone } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

import { BudgetTotal } from "./budget-total"
import { BudgetsSheet } from "./budgets-sheet"

/**
 * Tổng quan's "Hạn mức tháng này": the whole month's limit, then the two or
 * three groups closest to (or past) theirs, each a bar; a tap anywhere opens
 * every limit (BudgetsSheet). Nothing while no limit is set: they are set
 * from Cài đặt or the transactions page. `initialOpen`: a push about a limit
 * was tapped.
 */
export function BudgetOverviewCard({ overview, initialOpen = false }: { overview: BudgetOverview; initialOpen?: boolean }) {
  const [open, setOpen] = React.useState(initialOpen)
  if (!hasAnyBudget(overview)) return <BudgetsSheet overview={overview} open={open} onOpenChange={setOpen} />

  const closest = groupsByUse(overview).slice(0, 3)
  const show = () => setOpen(true)

  return (
    <Section
      title="Hạn mức tháng này"
      action={
        <button
          type="button"
          onClick={show}
          className="relative flex shrink-0 items-center gap-0.5 text-sm font-medium text-foreground/70 transition-colors after:absolute after:-inset-x-2 after:-inset-y-3 hover:text-foreground active:opacity-60"
        >
          Xem tất cả <ChevronRightIcon className="size-4" aria-hidden="true" />
        </button>
      }
    >
      <Card size="lg" asChild>
        <button type="button" onClick={show} className="w-full text-left transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100">
          <CardContent>
            {hasLimit(overview.total) ? <BudgetTotal overview={overview} compact /> : null}
            {closest.length > 0 ? (
              <ul className={cn("flex flex-col gap-4", hasLimit(overview.total) && "mt-5 border-t border-separator pt-4")}>
                {closest.map((group) => {
                  const state = budgetState(group.spent, group.limit)
                  return (
                    <li key={group.groupId} className="flex items-center gap-3">
                      <IconTile icon={categoryIconRegistry[group.iconName]} tone={group.colorName} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="truncate font-medium">{group.name}</span>
                          <span
                            className={cn(
                              "shrink-0 text-xs text-muted-foreground tabular-nums",
                              state === "near" && "text-warning",
                              state === "over" && "text-expense",
                            )}
                          >
                            {state === "over" ? `Vượt ${formatCompactCurrency(group.spent - group.limit, 1)}` : `${budgetPercent(group.spent, group.limit)}%`}
                          </span>
                        </span>
                        <LimitBar value={group.spent} max={group.limit} tone={limitTone(group.spent, group.limit)} label={`${group.name} đã dùng`} />
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </CardContent>
        </button>
      </Card>
      <BudgetsSheet overview={overview} open={open} onOpenChange={setOpen} />
    </Section>
  )
}
