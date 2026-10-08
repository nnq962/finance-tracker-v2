import type * as React from "react"

type BudgetLayoutProps = {
  /** The total and its split by account type. */
  summary: React.ReactNode
  /** The accounts, grouped by type. */
  children: React.ReactNode
}

/**
 * The page's width from lg up: the rail, the gap and a 42rem list, capped like
 * the settings list, since on a wide window a full-width row would put each
 * balance far from its account's name. On the whole page, so the header's
 * action keeps the list's right edge.
 */
export const budgetPageClassName = "lg:max-w-[64rem] xl:max-w-[68rem]"

/**
 * The budget page's sections, shared with its loading state. Below lg they
 * stack. From lg up the summary is a rail on the left that stays in view while
 * the accounts scroll beside it, as on the overview and transactions.
 */
export function BudgetLayout({ summary, children }: BudgetLayoutProps) {
  return (
    <div className="grid min-w-0 items-start gap-6 md:gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      {/* 5rem clears the app shell's sticky header (4rem) with room to spare.
          The list opens with its group's caption (24px and an 8px gap) and the
          rail has none, so the rail starts that much lower: the lead card's
          top lines up with the list's card. */}
      <div className="min-w-0 lg:sticky lg:top-20 lg:mt-8">{summary}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
