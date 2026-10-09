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
          4px of room each side keep the card's ring clear of the fold's clip.
          From lg up the fold steps aside (contents) for the rail. */}
      <Collapse
        open={!listOnly}
        className="max-lg:-m-1 lg:contents"
        contentClassName="lg:contents"
      >
        <div className="flex min-w-0 flex-col gap-6 *:shrink-0 max-lg:p-1 md:gap-8">
          {summary}
          {filters ? <div className="hidden lg:block">{filters}</div> : null}
        </div>
      </Collapse>
      {/* A container, so rows show more once the list itself is wide. From lg
          up the search lines up with the top of the month's card, and the list
          is a pane pinned below the shell's sticky header (4rem, 5rem with
          room) down to 1rem above the window's bottom, scrolling on its own
          and not handing the scroll on to the page at its ends. 4px of margin
          and padding keep the cards' rings from being clipped by the pane. */}
      <div className="@container flex min-w-0 flex-col gap-6 md:gap-8 lg:sticky lg:top-20 lg:-m-1 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:p-1 lg:[scrollbar-width:thin]">
        {children}
      </div>
    </div>
  )
}
