"use client"

import * as React from "react"
import { createPortal, flushSync } from "react-dom"
import { ChevronLeftIcon, XIcon } from "lucide-react"
import { motion, useMotionValue, useReducedMotion } from "motion/react"

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
 * which scrolls under it and fades down to the very edge, the home
 * indicator's strip too; the button sits just above that strip (16px where
 * there is none) and floats, with the same soft shadow as the bar's round
 * buttons. The content's end stops above it.
 * An error above the button sits on the sheet's own surface, so the content
 * scrolling under the footer never shows through its text (2026-10-17).
 * Put it last in the sheet's content, inside a form when it submits one: the
 * form then fills the sheet (`flex flex-1 flex-col`) so the footer sits at
 * the bottom even when the fields are few.
 */
export function PageSheetFooter({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-sheet-footer"
      className={cn("sticky bottom-0 z-10 -mx-4 mt-auto -mb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-2 px-4 pt-8 pb-[max(1rem,env(safe-area-inset-bottom,0px))] [&_[data-slot=button]]:shadow-[0_4px_16px_rgb(0_0_0/0.12)] [&>[data-slot=field-error]]:rounded-xl [&>[data-slot=field-error]]:bg-(--page-sheet-surface) [&>[data-slot=field-error]]:px-3 [&>[data-slot=field-error]]:py-2", className)}
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

type PageSheetProps = {
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
}

/**
 * iOS's page sheet, the app's one sheet: it rises to just below the status
 * bar over the dimmed page and is dragged down or closed with the round ✕ at
 * the top left; the title is centred and an action may sit on the right.
 * Content scrolls under the bar and fades into it. Centred, 32rem wide, on
 * tablets; a panel floating at the right on desktop.
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
 *
 * A PageSheet opened from inside another (an account's editor from its
 * sheet, a transaction from an account's list) is not a second sheet over
 * the first (2026-10-18): it is pushed into the open one, its content
 * sliding in from the right as the first slides out to the left, its bar
 * with ‹ that goes back. Closing the open sheet closes those too.
 */
export function PageSheet(props: PageSheetProps) {
  const host = React.useContext(PaneHostContext)
  return host ? <PaneSheet host={host} {...props} /> : <RootSheet {...props} />
}

/* ---------- Screens pushed into an open sheet ---------- */

type PaneEntry = { id: string; seq: number; closing: boolean }
/** What the sheet needs to know of a pushed screen to draw the fade and keep its place. */
type PaneInfo = {
  screenKey: string
  behindTitle: boolean
  surfaceColor: string
}
/** A pushed screen's ways out: Esc goes back; closing the sheet closes it. */
type PaneHandlers = { back: () => void; close: () => void }
type PaneSlots = { content?: HTMLElement | null; bar?: HTMLElement | null }

type PaneHost = {
  entries: PaneEntry[]
  slots: Record<string, PaneSlots | undefined>
  open: (id: string) => void
  close: (id: string) => void
  setInfo: (id: string, info: PaneInfo) => void
  setHandlers: (id: string, handlers: PaneHandlers | undefined) => void
}

const PaneHostContext = React.createContext<PaneHost | null>(null)

/** The push: both screens move together, 110% clearing each one's side padding (approved 2026-10-18). */
const pushEase = [0.32, 0.72, 0, 1] as const
const pushSeconds = 0.35

type PanePlace = "top" | "covered" | "leaving-back" | "leaving-on"

/**
 * One screen of the sheet, stacked with the others in one grid cell: shown,
 * pushed off to the left (then hidden, kept with what was typed) under a
 * deeper one, or sliding away. While it moves out its content stays where
 * it was, although the sheet's one scroller moves to the next screen's place.
 */
function PaneFrame({
  place,
  enter,
  bodyRef,
  onLeft,
  surfaceColor,
  children,
}: {
  place: PanePlace
  /** Slides in from the right when it first shows; the sheet's first screen does not. */
  enter: boolean
  bodyRef: React.RefObject<HTMLDivElement | null>
  onLeft?: () => void
  surfaceColor: string
  children: React.ReactNode
}) {
  const reduced = useReducedMotion()
  const frameRef = React.useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const outgoing = place !== "top"
  React.useLayoutEffect(() => {
    const body = bodyRef.current
    if (!outgoing || !body) {
      y.set(0)
      return
    }
    const from = body.scrollTop
    const follow = () => y.set(body.scrollTop - from)
    body.addEventListener("scroll", follow, { passive: true })
    return () => body.removeEventListener("scroll", follow)
  }, [outgoing, bodyRef, y])
  // Back on top (or newly pushed): focus comes with it, as the screen it left is hidden.
  const wasTop = React.useRef(place === "top")
  React.useEffect(() => {
    const frame = frameRef.current
    if (place === "top" && !wasTop.current && frame && !frame.contains(document.activeElement)) frame.focus({ preventScroll: true })
    wasTop.current = place === "top"
  }, [place])

  const transition = { duration: reduced ? 0 : pushSeconds, ease: pushEase }
  const target =
    place === "top"
      ? { x: 0, display: "flex" }
      : place === "covered"
        ? { x: "-110%", transitionEnd: { display: "none" } }
        : { x: place === "leaving-on" ? "-110%" : "110%" }

  return (
    <motion.div
      ref={frameRef}
      tabIndex={-1}
      inert={outgoing}
      initial={enter ? { x: "110%" } : false}
      animate={target}
      transition={transition}
      onAnimationComplete={() => {
        if (place === "leaving-back" || place === "leaving-on") onLeft?.()
      }}
      className="col-start-1 row-start-1 flex min-w-0 flex-col outline-none"
      style={{ y, "--page-sheet-surface": surfaceColor } as React.ComponentProps<typeof motion.div>["style"]}
    >
      {children}
    </motion.div>
  )
}

const contentClassName = "flex flex-1 flex-col px-4 pt-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"

/**
 * The bar: the round ✕ or ‹ on the left, the small title in the middle, an
 * action on the right. 16 above (the grabber floats in it) and 8 below a 44
 * button: ✕ sits 16 from the sheet's top and side. Its round buttons always
 * float: a soft shadow, so they look the same at rest and scrolled. No
 * hairline in the dark since 2026-10-16: the button's grey already stands
 * off the black sheet. Each screen has its own; the shown one's fades in.
 */
function SheetBar({ left, title, action }: { left: React.ReactNode; title: React.ReactNode; action: React.ReactNode }) {
  return (
    <div className="grid h-17 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 px-4 pt-4 pb-2 [&_[data-variant=secondary]]:shadow-[0_4px_16px_rgb(0_0_0/0.1)]">
      {left}
      {/* Its own cell even when hidden (sr-only takes it out of the grid), so the action stays on the right. */}
      <div className="min-w-0">{title}</div>
      <div className="flex justify-end">{action}</div>
    </div>
  )
}

function barLayerClassName(shown: boolean) {
  return cn("absolute inset-0 transition-opacity duration-200 ease-out", shown ? "opacity-100" : "pointer-events-none opacity-0")
}

const titleClassName = "truncate text-center text-base"

function RootSheet({
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
}: PageSheetProps) {
  // The fade shows once the content has moved, so nothing at rest sits in it.
  const [scrolled, setScrolled] = React.useState(false)
  // A deeper screen opened from inside (usePageSheetScreen) takes over the bar.
  const [screen, setScreen] = React.useState<PageSheetScreen | null>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const fadeRef = React.useRef<HTMLDivElement>(null)

  // Sheets pushed into this one, in the order they opened.
  const [entries, setEntries] = React.useState<PaneEntry[]>([])
  const [slots, setSlots] = React.useState<Record<string, PaneSlots | undefined>>({})
  const [infos, setInfos] = React.useState<Record<string, PaneInfo | undefined>>({})
  const handlers = React.useRef<Record<string, PaneHandlers | undefined>>({})
  const seq = React.useRef(0)
  // Stable, so a pushed screen's effects do not run again as the stack changes.
  const pushPane = React.useCallback((id: string) => {
    setEntries((current) => {
      const found = current.find((entry) => entry.id === id)
      if (found && !found.closing) return current
      seq.current += 1
      return [...current.filter((entry) => entry.id !== id), { id, seq: seq.current, closing: false }]
    })
  }, [])
  const popPane = React.useCallback((id: string) => {
    setEntries((current) =>
      current.some((entry) => entry.id === id && !entry.closing)
        ? current.map((entry) => (entry.id === id ? { ...entry, closing: true } : entry))
        : current,
    )
  }, [])
  const setInfo = React.useCallback((id: string, info: PaneInfo) => {
    setInfos((current) => {
      const known = current[id]
      if (known && known.screenKey === info.screenKey && known.behindTitle === info.behindTitle && known.surfaceColor === info.surfaceColor)
        return current
      return { ...current, [id]: info }
    })
  }, [])
  const setHandlers = React.useCallback((id: string, value: PaneHandlers | undefined) => {
    if (value) handlers.current[id] = value
    else delete handlers.current[id]
  }, [])
  const host = React.useMemo<PaneHost>(
    () => ({
      entries,
      slots,
      open: pushPane,
      close: popPane,
      setInfo,
      setHandlers,
    }),
    [entries, slots, pushPane, popPane, setInfo, setHandlers],
  )
  const remove = React.useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id || !entry.closing))
  }, [])
  // One stable ref callback per screen and slot, so React does not call them on every render.
  const slotRefs = React.useRef<Record<string, (element: HTMLElement | null) => void>>({})
  const slotRef = (id: string, kind: keyof PaneSlots) =>
    (slotRefs.current[`${id}:${kind}`] ??= (element) =>
      setSlots((current) => (current[id]?.[kind] === element ? current : { ...current, [id]: { ...current[id], [kind]: element } })))

  const top = entries.filter((entry) => !entry.closing).at(-1)
  const topInfo = top ? infos[top.id] : undefined
  const ownSurface = surface === "grouped" ? "var(--background)" : "var(--popover)"
  const surfaceColor = topInfo?.surfaceColor ?? ownSurface
  const behindTitle = topInfo ? topInfo.behindTitle : !hideTitle || Boolean(screen)
  // The screen shown: where the sheet keeps its place when going deeper and back.
  const activeKey = top ? `${top.id}|${topInfo?.screenKey ?? ""}` : `root|${screen ? String(screen.title) : ""}`

  // Closing the sheet closes what was pushed into it: it opens again on its first screen.
  const closePushed = React.useCallback(() => {
    for (const handler of Object.values(handlers.current)) handler?.close()
  }, [])
  React.useEffect(() => {
    if (open === false) closePushed()
  }, [open, closePushed])

  // A screen change sets the fade at once, without its 200ms ease (2026-10-17):
  // going back to a scrolled screen from one at its top otherwise showed the
  // bar bare for a moment, then the fade easing in, a blink.
  const setFadeNow = React.useCallback((value: boolean) => {
    const fade = fadeRef.current
    if (fade) fade.style.transition = "none"
    flushSync(() => setScrolled(value))
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (fade) fade.style.transition = ""
      }),
    )
  }, [])
  // Where each screen was left (2026-10-17: going back, even past several
  // screens, finds the one behind where it was, not at its top). A screen is
  // known by its sheet and title. `lastTop` follows the user's scrolling: by
  // the time a new screen shows its content is already on the page and may
  // have cut the old scroll short.
  const lastTop = React.useRef(0)
  const shownKey = React.useRef(activeKey)
  const behind = React.useRef<{ key: string; top: number }[]>([])
  const pending = React.useRef(false)
  React.useLayoutEffect(() => {
    if (activeKey === shownKey.current) return
    const from = shownKey.current
    const fromTop = lastTop.current
    const to = activeKey
    shownKey.current = to
    pending.current = true
    requestAnimationFrame(() => {
      pending.current = false
      const body = bodyRef.current
      // The sheet closed meanwhile: it opens again at its first screen, at the top.
      if (!body) {
        behind.current = []
        lastTop.current = 0
        return
      }
      const back = behind.current.findIndex((entry) => entry.key === to)
      if (back === -1) {
        // Forward: the screen left behind remembers where it was; the new one opens at its top.
        behind.current.push({ key: from, top: fromTop })
        setFadeNow(false)
        body.scrollTo({ top: 0 })
        lastTop.current = 0
        return
      }
      // Back: where that screen was, once its content is tall enough again (a few frames at most).
      const top = behind.current[back].top
      behind.current.length = back
      lastTop.current = top
      setFadeNow(top > 0)
      let tries = 0
      const restore = () => {
        body.scrollTo({ top })
        if (Math.abs(body.scrollTop - top) > 1 && tries++ < 10) requestAnimationFrame(restore)
      }
      restore()
    })
  }, [activeKey, setFadeNow])
  // Closed, it forgets: it opens again at its first screen, at the top.
  React.useEffect(() => {
    if (open !== false) return
    shownKey.current = "root|"
    behind.current = []
    lastTop.current = 0
  }, [open])

  const shownTitle = screen ? screen.title : title
  const back = screen ? screen.onBack : onBack

  return (
    <Drawer
      variant="page"
      open={open}
      onOpenChange={(next) => {
        if (!next) closePushed()
        onOpenChange?.(next)
      }}
    >
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent
        variant="page"
        surface={surface}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={(event) => {
          // Esc goes back a screen where there is one to go back to (2026-10-18), else closes the sheet.
          const escapeBack = top ? handlers.current[top.id]?.back : back
          if (!escapeBack) return
          event.preventDefault()
          escapeBack()
        }}
        style={{ "--page-sheet-surface": ownSurface } as React.CSSProperties}
      >
        {/* Everything in the sheet, its bar's action and footer too, pushes the sheets it opens into it. */}
        <PaneHostContext value={host}>
          <div className="relative min-h-0 flex-1">
            {/* One scroller for the whole sheet; each screen's column fills it, so a
              footer last in the content reaches the bottom however short it is.
              Screens moving in and out sideways are cut at its edges. */}
            <div
              ref={bodyRef}
              data-slot="page-sheet-body"
              onScroll={(event) => {
                setScrolled(event.currentTarget.scrollTop > 0)
                // Not while a screen is changing: the content swap may cut the scroll short.
                if (!pending.current) lastTop.current = event.currentTarget.scrollTop
              }}
              className="absolute inset-0 overflow-x-hidden overflow-y-auto"
            >
              <div className="grid min-h-full grid-cols-1 grid-rows-1">
                <PaneFrame place={top ? "covered" : "top"} enter={false} bodyRef={bodyRef} surfaceColor={ownSurface}>
                  <div className={cn(contentClassName, className)}>
                    <PageSheetScreenContext value={setScreen}>{children}</PageSheetScreenContext>
                    {footer && !screen ? <PageSheetFooter>{footer}</PageSheetFooter> : null}
                  </div>
                </PaneFrame>
                {entries.map((entry) => (
                  <PaneFrame
                    key={entry.id}
                    place={!entry.closing ? (entry === top ? "top" : "covered") : top && top.seq > entry.seq ? "leaving-on" : "leaving-back"}
                    enter
                    bodyRef={bodyRef}
                    onLeft={() => remove(entry.id)}
                    surfaceColor={infos[entry.id]?.surfaceColor ?? ownSurface}
                  >
                    <div ref={slotRef(entry.id, "content")} className="flex flex-1 flex-col" />
                  </PaneFrame>
                ))}
              </div>
            </div>
            <div
              ref={fadeRef}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 z-10 h-21 opacity-0 transition-opacity duration-200 ease-out",
                scrolled && "opacity-100",
              )}
              style={{
                backgroundImage: fadeGradient(surfaceColor, behindTitle),
              }}
            />
            {/* Fade and bar sit above the content (2026-10-17): a row lifts itself (z-1) while hovered
              or pressed, which otherwise drew its grey over ✕ and the pencil. */}
            <div className="absolute inset-x-0 top-0 z-20 h-17">
              <div className={barLayerClassName(!top)} inert={Boolean(top)}>
                <SheetBar
                  left={
                    back ? (
                      <Button type="button" variant="secondary" size="icon" aria-label={backLabel} disabled={disabled} onClick={back}>
                        <ChevronLeftIcon />
                      </Button>
                    ) : (
                      <DrawerClose asChild>
                        <Button type="button" variant="secondary" size="icon" aria-label={closeLabel} disabled={disabled}>
                          <XIcon />
                        </Button>
                      </DrawerClose>
                    )
                  }
                  title={<DrawerTitle className={cn(titleClassName, hideTitle && !screen && "sr-only")}>{shownTitle}</DrawerTitle>}
                  action={screen ? (screen.action ?? null) : action}
                />
              </div>
              {entries.map((entry) => (
                <div key={entry.id} ref={slotRef(entry.id, "bar")} className={barLayerClassName(entry === top)} inert={entry !== top} />
              ))}
            </div>
          </div>
        </PaneHostContext>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * A PageSheet opened inside another: its content and bar go into the open
 * sheet as a screen pushed over the one that opened it. What it last showed
 * stays while it slides away, as a sheet's content stays while it closes.
 */
function PaneSheet({
  host,
  title,
  hideTitle = false,
  action,
  trigger,
  open: openProp,
  onOpenChange,
  surface = "grouped",
  footer,
  onBack,
  backLabel = "Quay lại",
  disabled = false,
  className,
  children,
}: PageSheetProps & { host: PaneHost }) {
  const id = React.useId()
  const [ownOpen, setOwnOpen] = React.useState(false)
  const open = openProp ?? ownOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOwnOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )
  const [screen, setScreen] = React.useState<PageSheetScreen | null>(null)
  const { open: push, close: pop, setInfo, setHandlers } = host

  React.useLayoutEffect(() => {
    if (open) push(id)
    else pop(id)
  }, [open, id, push, pop])
  React.useLayoutEffect(() => () => pop(id), [id, pop])

  const screenKey = screen ? String(screen.title) : ""
  const behindTitle = !hideTitle || Boolean(screen)
  const surfaceColor = surface === "grouped" ? "var(--background)" : "var(--popover)"
  React.useLayoutEffect(() => {
    setInfo(id, { screenKey, behindTitle, surfaceColor })
  }, [id, setInfo, screenKey, behindTitle, surfaceColor])

  const back = screen ? screen.onBack : (onBack ?? (() => setOpen(false)))
  React.useEffect(() => {
    setHandlers(id, { back, close: () => setOpen(false) })
  })
  React.useEffect(() => () => setHandlers(id, undefined), [id, setHandlers])

  // What it showed while open, kept while it slides away (callers often drop
  // their content as the sheet closes).
  const shown = React.useRef({ title, action, footer, children })
  // eslint-disable-next-line react-hooks/refs -- the last open render is kept on purpose, for the slide out.
  if (open) shown.current = { title, action, footer, children }
  // eslint-disable-next-line react-hooks/refs -- as above.
  const kept = open ? { title, action, footer, children } : shown.current

  const entry = host.entries.find((item) => item.id === id)
  const slots = entry ? host.slots[id] : undefined

  return (
    <>
      {React.isValidElement<{ onClick?: (event: React.MouseEvent) => void }>(trigger)
        ? React.cloneElement(trigger, {
            onClick: (event: React.MouseEvent) => {
              trigger.props.onClick?.(event)
              if (!event.defaultPrevented) setOpen(true)
            },
          })
        : trigger}
      {slots?.content
        ? createPortal(
            <div className={cn(contentClassName, className)}>
              <PageSheetScreenContext value={setScreen}>{kept.children}</PageSheetScreenContext>
              {kept.footer && !screen ? <PageSheetFooter>{kept.footer}</PageSheetFooter> : null}
            </div>,
            slots.content,
          )
        : null}
      {slots?.bar
        ? createPortal(
            <SheetBar
              left={
                <Button type="button" variant="secondary" size="icon" aria-label={backLabel} disabled={disabled} onClick={back}>
                  <ChevronLeftIcon />
                </Button>
              }
              title={
                <h2 className={cn(titleClassName, "font-heading font-semibold text-foreground", hideTitle && !screen && "sr-only")}>
                  {screen ? screen.title : kept.title}
                </h2>
              }
              action={screen ? (screen.action ?? null) : kept.action}
            />,
            slots.bar,
          )
        : null}
    </>
  )
}
