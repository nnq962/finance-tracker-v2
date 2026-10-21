import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Folds its content away and back, its height (or width, `axis="x"`)
 * sliding between nothing and what the content needs while it fades, so what
 * comes after moves up smoothly instead of jumping: the transactions page
 * making way for its search, the search's Huỷ sliding in. Closed, the content
 * stays mounted, so it opens without reloading, but is inert: out of the tab
 * order and of what screen readers read. Instant when motion is reduced.
 *
 * Shadows (2026-10-21): open, the content is not clipped by its box but by a
 * clip-path reaching 48 past it, so the shadows of the cards and buttons
 * inside show whole (they were cut, the month pill's into a line). While it
 * opens, the edge it grows from stays cut at the box (the content is still
 * being revealed there), and reaches out once the slide is done; closed, or
 * closing, it clips at its box as before.
 */
export function Collapse({
  open,
  axis = "y",
  className,
  contentClassName,
  children,
}: {
  open: boolean
  axis?: "x" | "y"
  className?: string
  /** On the clipping box inside, e.g. `lg:contents` where the fold only applies to phones. */
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="collapse"
      data-state={open ? "open" : "closed"}
      inert={!open}
      className={cn(
        "grid duration-300 ease-out motion-reduce:transition-none",
        axis === "y"
          ? cn("transition-[grid-template-rows,opacity,margin]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr] opacity-0")
          : cn("transition-[grid-template-columns,opacity]", open ? "grid-cols-[1fr]" : "grid-cols-[0fr] opacity-0"),
        className,
      )}
    >
      <div
        data-state={open ? "open" : "closed"}
        className={cn(
          "overflow-hidden data-[state=open]:overflow-visible motion-safe:data-[state=open]:[transition:clip-path_0s_300ms]",
          axis === "y"
            ? "min-h-0 [clip-path:inset(-48px_-48px_0_-48px)] data-[state=open]:[clip-path:inset(-48px_-48px_-64px_-48px)]"
            : "min-w-0 [clip-path:inset(-48px_0_-48px_-48px)] data-[state=open]:[clip-path:inset(-48px_-48px_-64px_-48px)]",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
