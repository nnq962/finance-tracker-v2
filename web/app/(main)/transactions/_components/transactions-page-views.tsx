"use client"

import * as React from "react"

import { Page } from "@/components/page"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { DebtsDashboard } from "../../debts/_components/debts-dashboard"
import { TransactionsScreen } from "./transactions-screen"

export type TransactionsPageView = "transactions" | "debts"

/**
 * Giao dịch and Vay nợ in one page (2026-10-21, the user's ask: the tab bar
 * down to three pages and Timi): a segmented control where the page's name
 * used to be switches between them at once, both loaded with the page; the
 * address follows (?view=debts) so a reload or a link lands on the same one.
 * Only the one shown is mounted: each has its own tools, floating button and
 * sheets. Each draws its own switch, so the switch remembers its thumb
 * (`memoryKey`); a tap moves the thumb first and builds the view after it.
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
    // Shrinks on a narrow phone (320) beside the month rather than pushing the page wider.
    <Tabs value={chosen} onValueChange={(next) => change(next as TransactionsPageView)} className="min-w-0">
      <TabsList variant="segmented" memoryKey="transactions-view" className="w-52 max-w-full" aria-label="Chi tiêu hoặc vay nợ">
        <TabsTrigger value="transactions">Chi tiêu</TabsTrigger>
        <TabsTrigger value="debts">Vay nợ</TabsTrigger>
      </TabsList>
    </Tabs>
  )

  return shown === "debts" ? (
    <DebtsDashboard {...debts} viewSwitch={viewSwitch} />
  ) : (
    <Page>
      <TransactionsScreen {...transactions} viewSwitch={viewSwitch} />
    </Page>
  )
}
