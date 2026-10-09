import type * as React from "react"

type BudgetLayoutProps = {
  /** The total and its split by account type. */
  summary: React.ReactNode
  /** The accounts, grouped by type. */
  children: React.ReactNode
}

/**
 * The accounts page's sections, shared with its loading state: the total on
 * top, the accounts under it. On phones the accounts are a list; from lg up
 * the total spans the page and the accounts are a grid of cards (chosen
 * 2026-10-09), so the page uses its whole width.
 */
export function BudgetLayout({ summary, children }: BudgetLayoutProps) {
  return (
    <div className="flex min-w-0 flex-col gap-6 md:gap-8">
      <div className="min-w-0">{summary}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
