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
 * sheets.
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
  const [seenView, setSeenView] = React.useState(view)
  if (view !== seenView) {
    setSeenView(view)
    setShown(view)
  }

  const change = (next: TransactionsPageView) => {
    setShown(next)
    const url = new URL(window.location.href)
    if (next === "debts") url.searchParams.set("view", "debts")
    else url.searchParams.delete("view")
    url.searchParams.delete("debt")
    window.history.replaceState(null, "", url)
  }

  const viewSwitch = (
    <Tabs value={shown} onValueChange={(next) => change(next as TransactionsPageView)}>
      <TabsList variant="segmented" className="w-52" aria-label="Giao dịch hoặc vay nợ">
        <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
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
