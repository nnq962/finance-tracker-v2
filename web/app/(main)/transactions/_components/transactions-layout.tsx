import type * as React from "react"

import { Collapse } from "@/components/app/collapse"
import { cn } from "@/lib/utils"

type TransactionsLayoutProps = {
  /** The month and its totals. */
  summary: React.ReactNode
  /** The filters, shown under the summary from lg up; phones open them from the toolbar. */
  filters?: React.ReactNode
  /** The search, then the list. */
  children: React.ReactNode
  /** Searching on a phone: the list alone, the summary folded out of the way. */
  listOnly?: boolean
}

/**
 * The transactions page's sections, shared with its loading state. Below lg
 * they stack. From lg up the summary and filters form a rail on the left that
 * stays in view while the list scrolls beside it, as on the overview.
 */
export function TransactionsLayout({ summary, filters, children, listOnly = false }: TransactionsLayoutProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 items-start gap-6 transition-[row-gap] duration-300 ease-out motion-reduce:transition-none md:gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]",
        listOnly && "max-lg:gap-y-0",
      )}
    >
      {/* 5rem clears the app shell's sticky header (4rem) with room to spare.
          A rail taller than the window scrolls on its own; the 4px margin and
          padding keep the cards' rings from being clipped by that. Its
          sections keep their height (shrink-0): squeezed to the window, the
          summary card, which clips its overflow, would be cut or vanish.
          Gaps, not space-y: the filters hidden below lg must not leave a
          margin. */}
      {/* Below lg it folds away while the list is alone, the gap after it
          closing with it, so the search slides up to the top.
          4px of room each side keep the card's ring clear of the fold's clip.
          From lg up the fold steps aside (contents) for the sticky rail. */}
      <Collapse
        open={!listOnly}
        className="max-lg:-m-1 lg:contents"
        contentClassName="lg:contents"
      >
        <div className="flex min-w-0 flex-col gap-6 *:shrink-0 max-lg:p-1 md:gap-8 lg:sticky lg:top-20 lg:-m-1 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:p-1 lg:[scrollbar-width:thin]">
          {summary}
          {filters ? <div className="hidden lg:block">{filters}</div> : null}
        </div>
      </Collapse>
      {/* A container, so rows show more once the list itself is wide. From lg
          up the search lines up with the top of the month's card. */}
      <div className="@container flex min-w-0 flex-col gap-6 md:gap-8">{children}</div>
    </div>
  )
}
