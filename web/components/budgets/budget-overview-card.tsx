"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { LimitBar } from "@/components/app/limit-bar"
import { Section } from "@/components/app/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { budgetPercent, groupsByUse, hasAnyBudget, hasLimit, limitTone, monthShare } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

import { JarsNote } from "./budget-detail"
import { BudgetTotal } from "./budget-total"
import { BudgetInvite, BudgetSuggestSheet } from "./budget-suggest"
import { BudgetFormSheet, BudgetsSheet } from "./budgets-sheet"

const INVITE_DISMISSED_KEY = "timi:budget-invite-dismissed"
const inviteListeners = new Set<() => void>()

/** The invitation put away on this device (a per-device convenience: browser storage may be missing). */
function useInviteDismissed() {
  return React.useSyncExternalStore(
    (listener) => {
      inviteListeners.add(listener)
      return () => inviteListeners.delete(listener)
    },
    () => {
      try {
        return localStorage.getItem(INVITE_DISMISSED_KEY) === "1"
      } catch {
        return false
      }
    },
    // Shown in the server's page, so the cards below do not move for those who keep it.
    () => false,
  )
}

function dismissInvite() {
  try {
    localStorage.setItem(INVITE_DISMISSED_KEY, "1")
  } catch {
    // Without storage it shows again next time.
  }
  for (const listener of inviteListeners) listener()
}

/**
 * Tổng quan's "Hạn mức tháng này": the whole month's limit, then the two or
 * three groups closest to (or past) theirs, each a bar; a tap anywhere opens
 * every limit (BudgetsSheet). With no limit yet (2026-10-17), "Hạn mức chi
 * tiêu" invites the first (BudgetInvite) until put away on this device.
 * `initialOpen`: a push about a limit was tapped.
 */
export function BudgetOverviewCard({ overview, initialOpen = false }: { overview: BudgetOverview; initialOpen?: boolean }) {
  const [open, setOpen] = React.useState(initialOpen)
  const [suggestOpen, setSuggestOpen] = React.useState(false)
  const [ownOpen, setOwnOpen] = React.useState(false)
  const dismissed = useInviteDismissed()
  if (!hasAnyBudget(overview)) {
    return (
      <>
        {dismissed ? null : (
          <Section title="Hạn mức chi tiêu">
            <Card size="lg">
              <CardContent>
                <BudgetInvite
                  overview={overview}
                  onSuggest={() => setSuggestOpen(true)}
                  onOwn={() => setOwnOpen(true)}
                  onDismiss={dismissInvite}
                />
              </CardContent>
            </Card>
          </Section>
        )}
        <BudgetsSheet overview={overview} open={open} onOpenChange={setOpen} />
        <BudgetSuggestSheet overview={overview} open={suggestOpen} onOpenChange={setSuggestOpen} />
        <BudgetFormSheet overview={overview} target={{ kind: "total" }} open={ownOpen} onOpenChange={setOwnOpen} />
      </>
    )
  }

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
            {hasLimit(overview.total) ? (
              <>
                {/* Named, so the month's limit reads apart from the groups' below (2026-10-17). */}
                <p className="mb-3 text-sm font-semibold">Hạn mức tổng</p>
                <BudgetTotal overview={overview} compact />
                {/* As in the sheet: "Theo hạng mục" just below counts what jars paid, the limits do not. */}
                <JarsNote amount={overview.total.fromJars} className="mt-1.5" />
              </>
            ) : null}
            {closest.length > 0 ? (
              <>
              {hasLimit(overview.total) ? (
                <p className="mt-5 border-t border-separator pt-4 text-sm font-semibold">Theo nhóm</p>
              ) : null}
              <ul className={cn("flex flex-col gap-4", hasLimit(overview.total) && "mt-3")}>
                {closest.map((group) => {
                  // One rule for the colour everywhere: amber from 80% or while running fast for the time gone.
                  const state = limitTone(group.spent, group.limit, monthShare(overview))
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
                        <LimitBar value={group.spent} max={group.limit} tone={state} label={`${group.name} đã dùng`} />
                      </span>
                    </li>
                  )
                })}
              </ul>
              </>
            ) : null}
            {/* Without the month's limit, under the groups instead. */}
            {hasLimit(overview.total) ? null : <JarsNote amount={overview.total.fromJars} className="mt-3" />}
          </CardContent>
        </button>
      </Card>
      <BudgetsSheet overview={overview} open={open} onOpenChange={setOpen} />
    </Section>
  )
}
