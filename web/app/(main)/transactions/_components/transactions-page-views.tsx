"use client"

import * as React from "react"

import { Page } from "@/components/page"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { DebtsDashboard } from "../../debts/_components/debts-dashboard"
import { TransactionsScreen } from "./transactions-screen"

export type TransactionsPageView = "transactions" | "debts"

const views = [
  ["transactions", "Chi tiêu"],
  ["debts", "Vay nợ"],
] as const

/**
 * Chi tiêu | Vay nợ: a large segmented control across the phone under the
 * bar, the two names as large titles from md. It keeps the chosen view
 * itself, so a tap re-renders only the switch and the thumb slides on the
 * tap's own frame (2026-10-24: with the choice kept by the page, a tap first
 * re-rendered the whole view shown, and the thumb stood ~230ms before it
 * moved).
 */
function ViewSwitch({ shown, onChange }: { shown: TransactionsPageView; onChange: (next: TransactionsPageView) => void }) {
  const [chosen, setChosen] = React.useState(shown)
  const [seenShown, setSeenShown] = React.useState(shown)
  if (shown !== seenShown) {
    setSeenShown(shown)
    setChosen(shown)
  }
  const choose = (next: TransactionsPageView) => {
    if (next === chosen) return
    setChosen(next)
    onChange(next)
  }

  return (
    <>
      <Tabs value={chosen} onValueChange={(next) => choose(next as TransactionsPageView)} className="md:hidden">
        <TabsList variant="segmented" size="lg" memoryKey="transactions-page-view" aria-label="Chi tiêu hoặc vay nợ" className="w-full">
          {views.map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div role="tablist" aria-label="Chi tiêu hoặc vay nợ" className="hidden min-w-0 items-baseline gap-4 md:flex">
        {views.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={chosen === value}
            onClick={() => choose(value)}
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
    </>
  )
}

/**
 * Giao dịch and Vay nợ in one page (2026-10-21, the user's ask: the tab bar
 * down to three pages and Timi): a switch (ViewSwitch) changes between them,
 * both loaded with the page; the address follows (?view=debts) so a reload or
 * a link lands on the same one. Only the one shown is mounted: each has its
 * own tools, floating button and sheets, and draws the switch in its header.
 * The new view is built once the thumb has slid there (250ms, 150 under
 * reduced motion; 2026-10-24): built at once, it took the old switch away
 * mid-slide and the new one picked the slide up a frame-drop later, which
 * read as a jerk. Its switch starts where the old one stopped (memoryKey).
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
  const [, startTransition] = React.useTransition()
  const [seenView, setSeenView] = React.useState(view)
  if (view !== seenView) {
    setSeenView(view)
    setShown(view)
  }
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const change = React.useCallback((next: TransactionsPageView) => {
    // The thumb's slide (TabsList: 250ms, 150 under reduced motion) runs first; the address
    // follows with the view, as Next re-renders the page for a replaced address too.
    const slide = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 150 : 250
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const url = new URL(window.location.href)
      if (next === "debts") url.searchParams.set("view", "debts")
      else url.searchParams.delete("view")
      url.searchParams.delete("debt")
      window.history.replaceState(null, "", url)
      startTransition(() => setShown(next))
    }, slide)
  }, [])

  // The same element for the view's whole stay, so the view does not re-render for it.
  const viewSwitch = React.useMemo(() => <ViewSwitch shown={shown} onChange={change} />, [shown, change])

  return shown === "debts" ? (
    <DebtsDashboard {...debts} viewSwitch={viewSwitch} />
  ) : (
    <Page>
      <TransactionsScreen {...transactions} viewSwitch={viewSwitch} />
    </Page>
  )
}
