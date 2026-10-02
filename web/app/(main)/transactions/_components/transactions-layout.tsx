import type * as React from "react"

type TransactionsLayoutProps = {
  /** The month and its totals. */
  summary: React.ReactNode
  /** The search and filters, then the list. */
  children: React.ReactNode
}

/**
 * The transactions page's sections, shared with its loading state. Below lg
 * they stack. From lg up the summary is a rail on the left that stays in view
 * while the list scrolls beside it, as on the overview.
 */
export function TransactionsLayout({ summary, children }: TransactionsLayoutProps) {
  return (
    <div className="grid min-w-0 items-start gap-6 md:gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      {/* 5rem clears the app shell's sticky header (4rem) with room to spare. */}
      <div className="min-w-0 lg:sticky lg:top-20">{summary}</div>
      {/* A container, so rows show more once the list itself is wide; capped
          so a row's title and amount stay within one glance on large screens. */}
      <div className="@container max-w-4xl min-w-0 space-y-6 md:space-y-8">{children}</div>
    </div>
  )
}
