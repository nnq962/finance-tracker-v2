import type * as React from "react"

import { groupCaptionClassName } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * The accounts page on desktop (lg up) is one grid of one card (2026-10-21,
 * "every card the size of an account card"): the total and its kinds, the
 * accounts, the jars, the locked accounts and the finished jars all sit in
 * it, two columns at lg, four from xl, every card 144 tall; nothing spans
 * the page.
 */
export const accountGridClassName = "grid grid-cols-2 gap-4 xl:grid-cols-4"

/** The one card shape: 144 tall (rounded 24 and 24 in, as Card size lg). */
export const gridCardClassName = "min-h-36"

/** A grid card that opens something: the press, the focus ring, and a lift under a mouse. */
export const gridButtonCardClassName = cn(
  gridCardClassName,
  "pressable text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30 [@media(hover:hover)]:transition-[scale,box-shadow] [@media(hover:hover)]:hover:shadow-card-hover",
)

/** Inside a grid card: the head at the top, the figure at the foot. */
export const gridCardContentClassName = "flex flex-1 flex-col justify-between gap-4"

/**
 * A grid card's head: a 36 media (logo, tile or ring) and the name with a
 * second line under it, the names starting at the card's top in every card,
 * whether it has a second line or not.
 */
export function GridCardHead({
  media,
  title,
  description,
}: {
  media: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <span className="flex min-w-0 items-start gap-3">
      <span className="flex shrink-0">{media}</span>
      <span className="flex min-w-0 flex-col pt-px">
        <span className="truncate font-medium">{title}</span>
        {description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
      </span>
    </span>
  )
}

/** A grid card that only shows (the total and its kinds). */
export function GridCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card size="lg" className={cn(gridCardClassName, className)}>
      <CardContent className={gridCardContentClassName}>{children}</CardContent>
    </Card>
  )
}

/** A desktop section of the grid: its caption, the cards, a note under them. */
export function GridSection({ title, note, children }: { title: React.ReactNode; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className={cn("px-4", groupCaptionClassName)}>{title}</h2>
      <div className={accountGridClassName}>{children}</div>
      {note ? <p className="px-4 text-sm text-muted-foreground">{note}</p> : null}
    </section>
  )
}
