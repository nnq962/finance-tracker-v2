import type * as React from "react"

type TransactionsLayoutProps = {
  /** The month and its totals. */
  summary: React.ReactNode
  /** The filters, shown under the summary from lg up; phones open them from the toolbar. */
  filters?: React.ReactNode
  /** The search, then the list. */
  children: React.ReactNode
}

/**
 * The transactions page's sections, shared with its loading state. Below lg
 * they stack. From lg up the summary and filters form a rail on the left that
 * stays in view while the list scrolls beside it, as on the overview.
 */
export function TransactionsLayout({ summary, filters, children }: TransactionsLayoutProps) {
  return (
    <div className="grid min-w-0 items-start gap-6 md:gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      {/* 5rem clears the app shell's sticky header (4rem) with room to spare.
          A rail taller than the window scrolls on its own; the 4px margin and
          padding keep the cards' rings from being clipped by that. */}
      <div className="min-w-0 space-y-6 md:space-y-8 lg:sticky lg:top-20 lg:-m-1 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:p-1 lg:[scrollbar-width:thin]">
        {summary}
        {filters ? <div className="hidden lg:block">{filters}</div> : null}
      </div>
      {/* A container, so rows show more once the list itself is wide. From lg
          up it starts 24px down, past the summary's caption (16px line, 8px
          gap), so the search lines up with the summary card. */}
      <div className="@container min-w-0 space-y-6 md:space-y-8 lg:pt-6">{children}</div>
    </div>
  )
}
