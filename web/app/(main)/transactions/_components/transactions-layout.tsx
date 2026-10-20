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
 * they stack. From lg up the summary and filters form a rail on the left,
 * shown whole in the page, and the list beside it is a pane pinned in the
 * window that scrolls on its own: scrolling the list leaves the page where
 * it is, and scrolling the page down the rail leaves the list in view.
 */
export function TransactionsLayout({ summary, filters, children, listOnly = false }: TransactionsLayoutProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 items-start gap-6 transition-[row-gap] duration-300 ease-out motion-reduce:transition-none md:gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]",
        listOnly && "max-lg:gap-y-0",
      )}
    >
      {/* The rail, whole: its sections keep their height (shrink-0), never
          squeezed to the window. Gaps, not space-y: the filters hidden below
          lg must not leave a margin. */}
      {/* Below lg it folds away while the list is alone, the gap after it
          closing with it, so the search slides up to the top.
          While open, the fold's clip reaches past the card by its shadow's
          reach (24 above, 48 below, and to the screen's edges at the sides, 2026-10-20), its margins
          cancelling the room so nothing moves; that room lets taps through to
          the header and the search it overlaps.
          From lg up the fold steps aside (contents) for the rail. */}
      <Collapse
        open={!listOnly}
        className="max-lg:pointer-events-none max-lg:data-[state=open]:-mx-4 max-lg:data-[state=open]:-mt-6 max-lg:data-[state=open]:-mb-12 lg:contents"
        contentClassName="lg:contents"
      >
        <div className="pointer-events-auto flex min-w-0 flex-col gap-6 *:shrink-0 max-lg:mx-4 max-lg:mt-6 max-lg:mb-12 md:gap-8">
          {summary}
          {filters ? <div className="hidden lg:block">{filters}</div> : null}
        </div>
      </Collapse>
      {/* A container, so rows show more once the list itself is wide. From lg
          up the search lines up with the top of the month's card, and the list
          is a pane pinned below the shell's sticky header (4rem, 5rem with
          room) down to 1rem above the window's bottom, scrolling on its own
          and not handing the scroll on to the page at its ends, with no scroll
          bar; the days' captions pin to its top. Margin and padding (24 at
          the sides, 4 on top, 48 of scroll room below) keep the cards'
          shadows from being clipped by the pane (2026-10-21). */}
      <div className="@container flex min-w-0 flex-col gap-6 md:gap-8 lg:sticky lg:top-20 lg:-mx-6 lg:-my-1 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:px-6 lg:pt-1 lg:pb-12 lg:[scrollbar-width:none] lg:[--sticky-caption-pad:0.75rem] lg:[--sticky-caption-top:-0.25rem] lg:[&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  )
}
