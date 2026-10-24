"use client"

import * as React from "react"

import { Page } from "@/components/page"
import { cn } from "@/lib/utils"

import { DebtsDashboard } from "../../debts/_components/debts-dashboard"
import { TransactionsScreen } from "./transactions-screen"

export type TransactionsPageView = "transactions" | "debts"

/**
 * Giao dịch and Vay nợ in one page (2026-10-21, the user's ask: the tab bar
 * down to three pages and Timi): a segmented control where the page's name
 * used to be switches between them at once, both loaded with the page; the
 * address follows (?view=debts) so a reload or a link lands on the same one.
 * Only the one shown is mounted: each has its own tools, floating button and
 * sheets. The switch is the two names as large titles side by side, the one
 * shown in ink, the other grey (2026-10-24, the Claude Design handoff; was a
 * segmented control); a tap greys the old one at once and builds the view
 * after it.
 */
export function TransactionsPageViews({
  view,
  transactions,
  debts,
}: {
  /** The view the address names; a new one (a link to a debt) switches to it. */
  view: TransactionsPageView
  transactions: Omit<React.ComponentProps<typeof TransactionsScreen>, "viewSwitch">
  debts: Omit<React.ComponentProps<typeof DebtsDashboard>, "viewSwitch">
}) {
  const [shown, setShown] = React.useState(view)
  // The switch follows a tap at once; the view after it, in the background
  // (2026-10-21): the old view's switch slides on the tap's own frame while
  // the new view is built, rather than the new one sliding ~150ms later.
  const [chosen, setChosen] = React.useState(view)
  const [, startTransition] = React.useTransition()
  const [seenView, setSeenView] = React.useState(view)
  if (view !== seenView) {
    setSeenView(view)
    setShown(view)
    setChosen(view)
  }

  const change = (next: TransactionsPageView) => {
    setChosen(next)
    startTransition(() => setShown(next))
    const url = new URL(window.location.href)
    if (next === "debts") url.searchParams.set("view", "debts")
    else url.searchParams.delete("view")
    url.searchParams.delete("debt")
    window.history.replaceState(null, "", url)
  }

  const viewSwitch = (
    <div role="tablist" aria-label="Chi tiêu hoặc vay nợ" className="flex min-w-0 items-baseline gap-4">
      {(
        [
          ["transactions", "Chi tiêu"],
          ["debts", "Vay nợ"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={chosen === value}
          onClick={() => chosen !== value && change(value)}
          className={cn(
            // The page title's type; 44 tall to the touch, as the round buttons beside it.
            "pressable relative min-w-0 truncate text-2xl leading-8 font-semibold tracking-tight outline-none transition-[scale,color] duration-150 after:absolute after:inset-x-0 after:-inset-y-1.5 focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/30",
            chosen === value ? "text-foreground" : "text-muted-foreground/70",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return shown === "debts" ? (
    <DebtsDashboard {...debts} viewSwitch={viewSwitch} />
  ) : (
    <Page>
      <TransactionsScreen {...transactions} viewSwitch={viewSwitch} />
    </Page>
  )
}
