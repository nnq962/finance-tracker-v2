"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A value that changes in place because the data behind it did (another
 * month on Giao dịch's card, a category's share on Tổng quan), after
 * transitions.dev's "text swap soft" (2026-10-24): the old figure blurs out
 * while the new one blurs in, together and in the same spot, 200ms
 * ease-in-out, blur 2px; nothing slides, so a whole card of figures can
 * change at once. Under reduced motion a 150ms fade with no blur. The first
 * value shows at once, and the old one is out of the way of taps and screen
 * readers while it fades.
 *
 * `value` is what the figure is drawn from; `children` draws it (by default
 * the value as text). `align="end"` for figures on the right of a row;
 * `inline` inside a line of text (a count in a caption) rather than filling
 * its box.
 */
export function SoftSwap<T extends string | number>({
  value,
  children = (shown) => shown,
  align = "start",
  inline = false,
  className,
}: {
  value: T
  children?: (value: T) => React.ReactNode
  align?: "start" | "end"
  inline?: boolean
  className?: string
}) {
  const [shown, setShown] = React.useState({ value, id: 0 })
  const [leaving, setLeaving] = React.useState<{ value: T; id: number } | null>(null)
  if (shown.value !== value) {
    setLeaving(shown)
    setShown({ value, id: shown.id + 1 })
  }
  const layer = inline ? "inline-flex" : "flex min-w-0"

  return (
    <span
      data-slot="soft-swap"
      className={cn(
        inline ? "inline-grid" : "grid w-full min-w-0",
        "*:col-start-1 *:row-start-1",
        align === "end" ? "justify-items-end" : "justify-items-start",
        className,
      )}
    >
      {leaving ? (
        <span
          key={leaving.id}
          aria-hidden="true"
          className={cn(layer, "pointer-events-none animate-soft-out motion-reduce:animate-soft-fade-out")}
          onAnimationEnd={(event) => event.target === event.currentTarget && setLeaving(null)}
        >
          {children(leaving.value)}
        </span>
      ) : null}
      <span key={shown.id} className={cn(layer, shown.id > 0 && "animate-soft-in motion-reduce:animate-soft-fade-in")}>
        {children(shown.value)}
      </span>
    </span>
  )
}
