import type * as React from "react"

import { toggleVariants } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

/**
 * A row of chips that scrolls sideways, as filter rows do in native apps: it
 * runs to the screen's edges (the page's side padding, --main-content-px) so
 * chips slide out under the edge rather than stop short of it, and its first
 * chip still lines up with the page. Its own few pixels above and below keep
 * the chips' focus rings and press scale from being clipped. Holds Toggle
 * Group chips, a ChipButton, a ChipRowDivider between kinds of chip.
 */
export function ChipRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chip-row"
      className={cn(
        "-mx-(--main-content-px) -my-1 flex min-w-0 items-center gap-2 overflow-x-auto px-(--main-content-px) py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  )
}

/** A short upright line between groups of chips, e.g. the filter button and the kinds. */
export function ChipRowDivider() {
  return <span aria-hidden="true" className="h-5 w-px shrink-0 bg-foreground/15" />
}

/**
 * A chip that opens something rather than switching on: a filter sheet. Same
 * look as the row's toggle chips; `active` fills it dark while what it opens
 * narrows the list, so a filter in force shows from the row.
 */
export function ChipButton({
  active = false,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="chip-button"
      data-active={active || undefined}
      className={cn(
        toggleVariants({ size: "sm" }),
        "data-active:bg-primary data-active:text-primary-foreground data-active:hover:bg-primary/90 data-active:hover:text-primary-foreground",
        className,
      )}
      {...props}
    />
  )
}
