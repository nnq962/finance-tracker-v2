import type * as React from "react"

type BudgetLayoutProps = {
  /** The total and its split by account type. */
  summary: React.ReactNode
  /** The accounts, grouped by type. */
  children: React.ReactNode
}

/**
 * The budget page's sections, shared with its loading state. Below lg they
 * stack. From lg up the summary is a rail on the left that stays in view while
 * the accounts scroll beside it, as on the overview and transactions. Both
 * columns open with a caption of the same height, so their cards line up.
 */
export function BudgetLayout({ summary, children }: BudgetLayoutProps) {
  return (
    <div className="grid min-w-0 items-start gap-6 md:gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      {/* 5rem clears the app shell's sticky header (4rem) with room to spare. */}
      <div className="min-w-0 lg:sticky lg:top-20">{summary}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
