"use client"

import * as React from "react"
import { ChevronLeftIcon, XIcon } from "lucide-react"

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
 * The same veil at the foot, under a footer's button: thick from the
 * sheet's bottom edge up through the button, thinning above it to nothing,
 * so the content scrolling under the button fades rather than being cut.
 * Over the end of the content, which stops above it, it shows nothing.
 */
const footerFade = (() => {
  const mix = (percent: number) => `color-mix(in oklab, var(--page-sheet-surface) ${percent}%, transparent)`
  const stops = [[96, 0], [94, 45], [82, 64], [50, 78], [20, 90], [0, 100]]
  return `linear-gradient(to top, ${stops.map(([percent, at]) => `${mix(percent)} ${at}%`).join(", ")})`
})()

/**
 * A PageSheet's footer, e.g. the Save button (default size, full width) and
 * an error above it. It stays at the sheet's bottom edge over the content,
 * which scrolls under it and fades, and the content's end stops above it.
 * Put it last in the sheet's content, inside a form when it submits one: the
 * form then fills the sheet (`flex flex-1 flex-col`) so the footer sits at
 * the bottom even when the fields are few.
 */
export function PageSheetFooter({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-sheet-footer"
      className={cn("sticky bottom-0 z-10 -mx-4 -mb-4 mt-auto flex flex-col gap-2 px-4 pt-8 pb-4", className)}
      style={{ backgroundImage: footerFade, ...style }}
      {...props}
    />
  )
}

/**
 * iOS's page sheet, the app's one sheet: it rises to just below the status
 * bar over the dimmed page and is dragged down or closed with the round ✕ at
 * the top left; the title is centred and an action may sit on the right.
 * Content scrolls under the bar and fades into it. Centred, 32rem wide, on
 * wider screens.
 *
 * The small title in the bar is the usual one; `hideTitle` when the content
 * opens with its own large title (the plans), and the bar then shows only its
 * buttons. `surface`: the page's grey by default, white cards and groups of
 * rows on it, as on the pages; `plain` (white) only for a sheet that is one
 * bare form. `footer` (or a PageSheetFooter last in the content), e.g. a
 * Save button, floats over the end of the content, which scrolls under it.
 *
 * Inside the sheet, a screen deeper than the first (an editor opened from a
 * list) passes `onBack`: the round button on the left turns into ‹ and goes
 * back instead of closing. `disabled` holds the sheet while it saves. The
 * sheet does not focus its first field on opening, so the keyboard waits
 * for a tap, as in the app's other sheets.
 */
export function PageSheet({
  title,
  hideTitle = false,
  action,
  closeLabel = "Đóng",
  trigger,
  open,
  onOpenChange,
  surface = "grouped",
  footer,
  onBack,
  backLabel = "Quay lại",
  disabled = false,
  onCloseAutoFocus,
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
  /** Back within the sheet; the left button then shows ‹ instead of ✕. */
  onBack?: () => void
  backLabel?: string
  /** While saving: the bar's left button cannot leave. */
  disabled?: boolean
  /** Where focus goes once the sheet has closed, e.g. back to a field. */
  onCloseAutoFocus?: (event: Event) => void
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
      <DrawerContent
        variant="page"
        surface={surface}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={onCloseAutoFocus}
        style={{ "--page-sheet-surface": surfaceColor } as React.CSSProperties}
      >
        <div className="relative min-h-0 flex-1">
          {/* One scroller for the whole sheet; its column fills it, so a footer
              last in the content reaches the bottom however short it is. */}
          <div
            data-slot="page-sheet-body"
            onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
            className="absolute inset-0 overflow-y-auto"
          >
            <div className={cn("flex min-h-full flex-col px-4 pt-17 pb-4", className)}>
              {children}
              {footer ? <PageSheetFooter>{footer}</PageSheetFooter> : null}
            </div>
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
              Its round buttons always float: a soft shadow, a hairline in the dark, so they look the same at rest and scrolled. */}
          <div className="absolute inset-x-0 top-0 grid h-17 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 px-4 pt-4 pb-2 [&_[data-variant=secondary]]:shadow-[0_4px_16px_rgb(0_0_0/0.1)] dark:[&_[data-variant=secondary]]:ring-1 dark:[&_[data-variant=secondary]]:ring-foreground/10">
            {onBack ? (
              <Button type="button" variant="secondary" size="icon" aria-label={backLabel} disabled={disabled} onClick={onBack}>
                <ChevronLeftIcon />
              </Button>
            ) : (
              <DrawerClose asChild>
                <Button type="button" variant="secondary" size="icon" aria-label={closeLabel} disabled={disabled}>
                  <XIcon />
                </Button>
              </DrawerClose>
            )}
            {/* Its own cell even when hidden (sr-only takes it out of the grid), so the action stays on the right. */}
            <div className="min-w-0">
              <DrawerTitle className={cn("truncate text-center text-base", hideTitle && "sr-only")}>{title}</DrawerTitle>
            </div>
            <div className="flex justify-end">{action}</div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
