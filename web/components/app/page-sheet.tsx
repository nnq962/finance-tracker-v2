"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

/**
 * Where content scrolled up meets the bar, as in Claude's sheets: a veil of
 * the sheet's surface from the sheet's top edge, grabber included, over the
 * whole bar, strongest at the top and thinning down past the buttons to
 * nothing 16px below the bar. Rows stay faintly visible as they pass under
 * it, up to the edge, and no line shows where it ends. Behind a title the
 * veil stays thick through the title's line, so it reads clearly.
 */
function fadeGradient(surface: string, behindTitle: boolean) {
  const mix = (percent: number) => `color-mix(in oklab, ${surface} ${percent}%, transparent)`
  const stops = behindTitle
    ? [[96, 0], [94, 25], [88, 55], [60, 68], [32, 80], [12, 91], [0, 100]]
    : [[92, 0], [84, 14], [70, 30], [54, 46], [36, 62], [20, 76], [8, 89], [0, 100]]
  return `linear-gradient(to bottom, ${stops.map(([percent, at]) => `${mix(percent)} ${at}%`).join(", ")})`
}

/**
 * iOS's page sheet: it rises to just below the status bar over the dimmed
 * page and is dragged down or closed with the round ✕ at the top left; the
 * title is centred and an action may sit on the right. Content scrolls under
 * the bar and fades into it. Centred, 32rem wide, on wider screens.
 *
 * `hideTitle` when the content opens with its own large title (the plans):
 * the bar then shows only its buttons. `surface="grouped"`: the page's grey,
 * for white cards and groups of rows; plain (white) for forms. `footer`
 * stays below the scrolling content, e.g. a Save button.
 */
export function PageSheet({
  title,
  hideTitle = false,
  action,
  closeLabel = "Đóng",
  trigger,
  open,
  onOpenChange,
  surface = "plain",
  footer,
  className,
  children,
}: {
  title: React.ReactNode
  hideTitle?: boolean
  /** A control on the right of the bar, e.g. a round Edit button. */
  action?: React.ReactNode
  closeLabel?: string
  /** What opens the sheet, when it is not opened from state. */
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  surface?: "plain" | "grouped"
  footer?: React.ReactNode
  /** Lays out the scrolling content, e.g. space between its blocks. */
  className?: string
  children: React.ReactNode
}) {
  // The fade shows once the content has moved, so nothing at rest sits in it.
  const [scrolled, setScrolled] = React.useState(false)
  const surfaceColor = surface === "grouped" ? "var(--background)" : "var(--popover)"

  return (
    <Drawer variant="page" open={open} onOpenChange={onOpenChange}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent variant="page" surface={surface} aria-describedby={undefined}>
        <div className="relative min-h-0 flex-1">
          <div
            data-slot="page-sheet-body"
            onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
            className={cn("absolute inset-0 overflow-y-auto px-4 pt-17 pb-4", className)}
          >
            {children}
          </div>
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-21 opacity-0 transition-opacity duration-200 ease-out",
              scrolled && "opacity-100",
            )}
            style={{ backgroundImage: fadeGradient(surfaceColor, !hideTitle) }}
          />
          {/* 16 above (the grabber floats in it) and 8 below a 44 button: ✕ sits 16 from the sheet's top and side.
              Scrolled, its round buttons lift off the content passing under them: a soft shadow, a hairline in the dark. */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 grid h-17 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 px-4 pt-4 pb-2",
              scrolled &&
                "[&_[data-variant=secondary]]:shadow-[0_4px_16px_rgb(0_0_0/0.1)] dark:[&_[data-variant=secondary]]:ring-1 dark:[&_[data-variant=secondary]]:ring-foreground/10",
            )}
          >
            <DrawerClose asChild>
              <Button type="button" variant="secondary" size="icon" aria-label={closeLabel}>
                <XIcon />
              </Button>
            </DrawerClose>
            <DrawerTitle className={cn("truncate text-center text-base", hideTitle && "sr-only")}>{title}</DrawerTitle>
            <div className="flex justify-end">{action}</div>
          </div>
        </div>
        {footer ? <div className="shrink-0 p-4">{footer}</div> : null}
      </DrawerContent>
    </Drawer>
  )
}
