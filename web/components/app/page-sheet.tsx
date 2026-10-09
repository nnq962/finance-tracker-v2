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

type PageSheetScreen = {
  title: React.ReactNode
  onBack: () => void
  /**
   * On the right of the bar, in place of the sheet's own action, e.g. a
   * pencil to edit what the screen shows. Taken when the screen opens or its
   * title changes, so its handlers should only call stable setters.
   */
  action?: React.ReactNode
}

const PageSheetScreenContext = React.createContext<((screen: PageSheetScreen | null) => void) | null>(null)

/**
 * A screen deeper than the sheet's first, opened by something inside it (a
 * form's "pick a category" list): while `screen` is set, the bar shows its
 * title and a ‹ that calls its `onBack`, and the content opens at its top;
 * back on the first screen, the bar is the sheet's own again and the content
 * is where it was left. The sheet's action and footer are hidden meanwhile;
 * the screen may bring its own action. The caller shows the deeper screen's
 * content itself.
 */
export function usePageSheetScreen(screen: PageSheetScreen | null) {
  const setScreen = React.useContext(PageSheetScreenContext)
  // The latest onBack, without re-registering the screen on every render.
  const onBack = React.useRef(screen?.onBack)
  React.useEffect(() => {
    onBack.current = screen?.onBack
  })
  const title = screen?.title ?? null
  const open = screen !== null
  const action = React.useRef(screen?.action)
  React.useEffect(() => {
    action.current = screen?.action
  })
  React.useEffect(() => {
    if (!setScreen || !open) return
    setScreen({ title, onBack: () => onBack.current?.(), action: action.current })
    return () => setScreen(null)
  }, [setScreen, open, title])
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
  // A deeper screen opened from inside (usePageSheetScreen) takes over the bar.
  const [screen, setScreenState] = React.useState<PageSheetScreen | null>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const firstScreenTop = React.useRef(0)
  const setScreen = React.useCallback((next: PageSheetScreen | null) => {
    const body = bodyRef.current
    setScreenState((current) => {
      if (body && !current && next) firstScreenTop.current = body.scrollTop
      return next
    })
    // After the content has changed: the deeper screen at its top, the first where it was.
    requestAnimationFrame(() => body?.scrollTo({ top: next ? 0 : firstScreenTop.current }))
  }, [])
  const shownTitle = screen ? screen.title : title
  const back = screen ? screen.onBack : onBack
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
            ref={bodyRef}
            data-slot="page-sheet-body"
            onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
            className="absolute inset-0 overflow-y-auto"
          >
            <div className={cn("flex min-h-full flex-col px-4 pt-20 pb-4", className)}>
              <PageSheetScreenContext value={setScreen}>{children}</PageSheetScreenContext>
              {footer && !screen ? <PageSheetFooter>{footer}</PageSheetFooter> : null}
            </div>
          </div>
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-21 opacity-0 transition-opacity duration-200 ease-out",
              scrolled && "opacity-100",
            )}
            style={{ backgroundImage: fadeGradient(surfaceColor, !hideTitle || Boolean(screen)) }}
          />
          {/* 16 above (the grabber floats in it) and 8 below a 44 button: ✕ sits 16 from the sheet's top and side.
              Its round buttons always float: a soft shadow, a hairline in the dark, so they look the same at rest and scrolled. */}
          <div className="absolute inset-x-0 top-0 grid h-17 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 px-4 pt-4 pb-2 [&_[data-variant=secondary]]:shadow-[0_4px_16px_rgb(0_0_0/0.1)] dark:[&_[data-variant=secondary]]:ring-1 dark:[&_[data-variant=secondary]]:ring-foreground/10">
            {back ? (
              <Button type="button" variant="secondary" size="icon" aria-label={backLabel} disabled={disabled} onClick={back}>
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
              <DrawerTitle className={cn("truncate text-center text-base", hideTitle && !screen && "sr-only")}>{shownTitle}</DrawerTitle>
            </div>
            <div className="flex justify-end">{screen ? (screen.action ?? null) : action}</div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
