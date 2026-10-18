"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { LimitBar } from "@/components/app/limit-bar"
import { Section } from "@/components/app/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { budgetPercent, groupsByUse, hasAnyBudget, hasLimit, limitTone, monthShare, nearLevel } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

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
 * Tổng quan's "Hạn mức tháng này" (made smaller 2026-10-19, option B of the
 * han-muc mockup): the whole month's limit (BudgetTotal compact: what is
 * left, the share, the bar, the pace), then the two or three groups closest
 * to (or past) theirs, each one line: a small tile, the name, the bar and
 * the share; a tap anywhere opens every limit (BudgetsSheet), which also
 * says what jars paid (the card no longer does). With no limit yet (2026-10-17), "Hạn mức chi
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
      <Card asChild>
        <button type="button" onClick={show} className="w-full text-left transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100">
          <CardContent>
            {hasLimit(overview.total) ? <BudgetTotal overview={overview} compact /> : null}
            {closest.length > 0 ? (
              <ul className={cn("flex flex-col gap-2.5", hasLimit(overview.total) && "mt-4")}>
                {closest.map((group) => {
                  // One rule for the colour everywhere: amber from the early warning or while running fast for the time gone.
                  const state = limitTone(group.spent, group.limit, monthShare(overview), nearLevel(overview.alerts))
                  return (
                    <li key={group.groupId} className="flex items-center gap-2.5">
                      <IconTile icon={categoryIconRegistry[group.iconName]} tone={group.colorName} size="xs" />
                      <span className="w-[84px] shrink-0 truncate text-sm font-medium">{group.name}</span>
                      <LimitBar value={group.spent} max={group.limit} tone={state} label={`${group.name} đã dùng`} className="flex-1" />
                      {/* Past the limit, how far over, as "+250k": the column is too narrow for a word. */}
                      <span
                        className={cn(
                          "w-10 shrink-0 text-right text-xs font-medium text-muted-foreground tabular-nums",
                          state === "near" && "font-semibold text-warning",
                          state === "over" && "font-semibold text-expense",
                        )}
                      >
                        {state === "over" ? `+${formatCompactCurrency(group.spent - group.limit, 1)}` : `${budgetPercent(group.spent, group.limit)}%`}
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
