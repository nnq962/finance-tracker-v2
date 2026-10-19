"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  type CSSProperties,
  type MouseEvent,
  type TouchEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react"
import { cn } from "cn"

import { RiBardFill } from "@remixicon/react"

import { useOpenAssistant } from "@/components/ai-assistant/assistant"
import { appNavigationItems, menuUrlFor } from "@/lib/app-navigation"
import { smoothCapsule } from "@/lib/smooth-capsule"

/**
 * The four pages on the bar (2026-10-20, option D of the nav mockup): Settings
 * left it for the avatar at the top of Tổng quan, and Timi took the fifth
 * slot. On /settings no tab is lit, as under a pushed screen.
 */
const mobileNavigationItems = appNavigationItems
/** The slots on the bar: the pages, then Timi. */
const slotCount = mobileNavigationItems.length + 1
/** Apple's kit: the pill is 54 tall and 2 wider than its tab on each side. */
const PILL_HEIGHT = 54
const PILL_EXTRA = 4
/** Phosphor's wallet and handshake read smaller than the others at 26 in the 28 box. */
const GLYPH_SIZE: Record<string, number> = { "/budget": 28, "/debts": 28 }
/** A tab: the 28 icon box over its name (10/700, −0.1 tracking), 1 apart, centred in the bar as the kit's button (padding 6 and 7). */
const tabClassName =
  "flex h-full min-w-0 touch-manipulation flex-col items-center justify-center gap-px rounded-full outline-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] focus-visible:ring-3 focus-visible:ring-ring/50"
const labelClassName = "text-[10px] leading-3 font-bold tracking-[-0.1px] whitespace-nowrap"

const tabUrls = new Set(mobileNavigationItems.map((item) => item.url))

/** How far a finger may drift off a tab and still pick it when lifted. */
const TOUCH_SLOP = 8

/** Input that means the user is scrolling the page themselves. */
const userScrollEvents = ["pointerdown", "wheel", "keydown"] as const

function getScrollViewport() {
  return document.querySelector<HTMLElement>("[data-main-scroll-viewport]")
}

/**
 * Offsets are kept per URL the screen was entered at, query included: a
 * filtered or deep-linked view of a tab page (/transactions?account=…) is a
 * screen of its own and must neither reuse nor overwrite the plain tab's
 * offset. Query changes made inside a screen (a debt chosen, the month) keep
 * saving under the key it was entered at.
 */
function currentScrollKey() {
  return window.location.pathname + window.location.search
}

function isTouchOnItem(event: TouchEvent<HTMLElement>) {
  const touch = event.changedTouches[0]
  if (!touch) return false

  const rect = event.currentTarget.getBoundingClientRect()
  return (
    touch.clientX >= rect.left - TOUCH_SLOP &&
    touch.clientX <= rect.right + TOUCH_SLOP &&
    touch.clientY >= rect.top - TOUCH_SLOP &&
    touch.clientY <= rect.bottom + TOUCH_SLOP
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const openAssistant = useOpenAssistant()
  const [visualPathname, setVisualPathname] = useState(pathname)
  const [isNavigationPending, startNavigation] = useTransition()
  const latestRequestedPathnameRef = useRef(pathname)
  const navigationInFlightRef = useRef(false)
  const recoveryPathnameRef = useRef<string | null>(null)
  const touchPreviewPathnameRef = useRef<string | null>(null)
  const activePathname = visualPathname

  // Each tab keeps where its page was scrolled and comes back there, as on a
  // native tab bar; any other page is a pushed screen and opens at the top.
  const scrollOffsetsRef = useRef(new Map<string, number>())
  // The key the current tab screen was entered at (null on other pages).
  const scrollKeyRef = useRef<string | null>(null)
  const cancelScrollRestoreRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const scrollViewport = getScrollViewport()

    if (!scrollViewport) {
      return
    }

    // The key is set by the restore below, in the same commit as the new
    // page, so a save never lands under the old screen's key.
    const rememberOffset = () => {
      const key = scrollKeyRef.current
      if (key) {
        scrollOffsetsRef.current.set(key, scrollViewport.scrollTop)
      }
    }

    scrollViewport.addEventListener("scroll", rememberOffset, { passive: true })

    return () => scrollViewport.removeEventListener("scroll", rememberOffset)
  }, [])

  // A layout effect, so the new page never paints at the old page's offset.
  // Next writes the URL in an insertion effect, so it is already current here.
  // Only a new pathname restores: a query-only change (the month switcher)
  // keeps the position it has.
  useLayoutEffect(() => {
    const scrollViewport = getScrollViewport()

    if (!scrollViewport) {
      return
    }

    const key = currentScrollKey()
    scrollKeyRef.current = tabUrls.has(window.location.pathname) ? key : null
    const top = scrollOffsetsRef.current.get(key) ?? 0

    scrollViewport.scrollTop = top

    if (scrollViewport.scrollTop >= top - 1) {
      return
    }

    // The page is still loading (an expired cache shows its skeleton) and too
    // short for the offset: follow it as it grows, until the user scrolls.
    const stop = () => {
      observer.disconnect()
      window.clearTimeout(timeout)
      for (const type of userScrollEvents) {
        scrollViewport.removeEventListener(type, stop)
      }
      cancelScrollRestoreRef.current = null
    }
    const observer = new ResizeObserver(() => {
      scrollViewport.scrollTop = top

      if (scrollViewport.scrollTop >= top - 1) {
        stop()
      }
    })
    const timeout = window.setTimeout(stop, 3000)

    for (const child of scrollViewport.children) {
      observer.observe(child)
    }
    for (const type of userScrollEvents) {
      scrollViewport.addEventListener(type, stop, { passive: true })
    }
    cancelScrollRestoreRef.current = stop

    return stop
  }, [pathname])

  useEffect(() => {
    if (isNavigationPending) {
      return
    }

    if (!navigationInFlightRef.current) {
      latestRequestedPathnameRef.current = pathname

      if (touchPreviewPathnameRef.current !== null) {
        return
      }

      if (visualPathname !== pathname) {
        // Sync browser back/forward and non-bottom-nav navigations.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisualPathname(pathname)
      }

      return
    }

    const requestedPathname = latestRequestedPathnameRef.current

    if (pathname === requestedPathname) {
      navigationInFlightRef.current = false
      recoveryPathnameRef.current = null
      return
    }

    // A very fast second tap can target the route that was still committed
    // when the first navigation began. Ensure the latest tap wins even if the
    // earlier transition happens to settle first.
    if (recoveryPathnameRef.current !== requestedPathname) {
      recoveryPathnameRef.current = requestedPathname
      startNavigation(() => {
        router.replace(requestedPathname, { scroll: false })
      })
      return
    }

    navigationInFlightRef.current = false
    recoveryPathnameRef.current = null
    latestRequestedPathnameRef.current = pathname
    // Reconcile the visual state only after both the original navigation and
    // its single recovery attempt have failed.
    setVisualPathname(pathname)
  }, [isNavigationPending, pathname, router, visualPathname])

  // Re-tapping the current tab scrolls its page back to the top, as native
  // tab bars do; iOS's tap on the status bar does not reach this inner pane.
  const scrollToTop = () => {
    cancelScrollRestoreRef.current?.()
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    getScrollViewport()?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  }

  const requestNavigation = (requestedPathname: string) => {
    if (!navigationInFlightRef.current && requestedPathname === pathname) {
      scrollToTop()
      return
    }

    if (
      navigationInFlightRef.current &&
      requestedPathname === latestRequestedPathnameRef.current
    ) {
      return
    }

    const shouldReplace = navigationInFlightRef.current

    navigationInFlightRef.current = true
    latestRequestedPathnameRef.current = requestedPathname
    recoveryPathnameRef.current = null
    setVisualPathname(requestedPathname)

    // The tab's own offset is restored above; Next must not scroll it too.
    startNavigation(() => {
      if (shouldReplace) {
        router.replace(requestedPathname, { scroll: false })
      } else {
        router.push(requestedPathname, { scroll: false })
      }
    })
  }

  const restingPathname = () =>
    navigationInFlightRef.current ? latestRequestedPathnameRef.current : pathname

  const navigateTo = (
    event: MouseEvent<HTMLAnchorElement>,
    requestedPathname: string,
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.currentTarget.target === "_blank"
    ) {
      return
    }

    event.preventDefault()
    touchPreviewPathnameRef.current = null
    requestNavigation(requestedPathname)
  }

  const activeIndex = mobileNavigationItems.findIndex((item) => item.url === menuUrlFor(activePathname))

  // The bar's size, for its outline, and where the current tab is, in whole
  // pixels: a pill sliding to a fraction of a pixel was snapped to the grid by
  // Safari as it stopped, a jerk in its last few pixels.
  const barRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [bar, setBar] = useState({ width: 0, height: 0 })
  const [pill, setPill] = useState({ x: 0, width: 0, height: 0 })
  useLayoutEffect(() => {
    const element = barRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setBar({ width: element.offsetWidth, height: element.offsetHeight }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    const tab = tabRefs.current[Math.max(activeIndex, 0)]
    const element = barRef.current
    if (tab && element) {
      // The pill is the tab's slot plus 2 each side and 54 tall, 4 inside the
      // bar, as Apple's kit draws it (_Tab Bar Button 72 wide, its pill 76×54).
      const box = tab.getBoundingClientRect()
      setPill({
        x: Math.round(box.left - element.getBoundingClientRect().left) - PILL_EXTRA / 2,
        width: Math.round(box.width) + PILL_EXTRA,
        height: PILL_HEIGHT,
      })
    }
  }, [activeIndex, bar.width])
  // Dev only (2026-10-20): the glass mockup at /zz-preview/glass sets a
  // translucency level in localStorage and the real bar shows it here.
  const glass = useSyncExternalStore(
    () => () => {},
    () => {
      if (process.env.NODE_ENV === "production") return null
      try {
        return localStorage.getItem("zz-tab-glass")
      } catch {
        return null
      }
    },
    () => null,
  )
  const glassLevel = useMemo(() => (glass ? (JSON.parse(glass) as { alpha: number; blur: number }) : null), [glass])
  const barOutline = bar.width ? smoothCapsule(bar.width, bar.height) : ""
  // The 1px white rim just outside the bar, as the glass edge catches the light.
  const barRim = bar.width ? smoothCapsule(bar.width + 1, bar.height + 1) : ""

  return (
    // Icons on a capsule across the screen, floating over the page;
    // the shell reserves its height in --tab-bar-space so the end of a page
    // can scroll above it. A screen that takes the whole height for a while
    // (searching) slides it off the bottom by rendering an element with
    // data-hide-tab-bar; it turns invisible once out of view, so it leaves the
    // tab order too, and slides back when that element goes.
    <nav
      aria-label="Điều hướng chính trên di động"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center px-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)-0.75rem))] transition-[translate,visibility] duration-300 ease-out motion-reduce:transition-none md:hidden [body:has([data-hide-tab-bar])_&]:invisible [body:has([data-hide-tab-bar])_&]:translate-y-full"
    >
      {/* iOS 26's tab bar (2026-10-11): a white capsule with continuous ends,
          raised by a wide soft shadow, the current tab on a grey pill nearly
          as tall, icons in ink over their names (named since 2026-10-20, with
          four pages and Timi as the fifth slot the capsule spans the width).
          The capsule, its edge and the pill are layers of their own behind
          the icons: with the blur on the list itself, Safari redrew the icons
          as the pill slid and they shook. */}
      <div ref={barRef} className="pointer-events-auto relative isolate h-[62px] min-w-0 max-w-md flex-1">
        {/* Apple's kit: one wide soft shadow (8 down, blurred 40, 12%) and a
            close one (8 down, blurred 15, 2%), on a plain capsule a pixel
            inside the bar: blurred this wide the ends' shape does not show, and
            a full-size one left a bright sliver at the joins of the continuous
            ends in the light theme. */}
        <div
          aria-hidden="true"
          className="absolute inset-px -z-20 rounded-full shadow-[0_8px_40px_rgb(0_0_0/0.12),0_8px_15px_rgb(0_0_0/0.02)] dark:shadow-[0_8px_40px_rgb(0_0_0/0.5)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-tab-bar backdrop-blur-xl backdrop-saturate-150"
          style={{
            ...(barOutline ? { clipPath: `path("${barOutline}")`, borderRadius: 0 } : undefined),
            ...(glassLevel
              ? { background: `color-mix(in oklab, var(--tab-bar) ${Math.round(glassLevel.alpha * 100)}%, transparent)`, backdropFilter: `blur(${glassLevel.blur}px) saturate(1.6)`, WebkitBackdropFilter: `blur(${glassLevel.blur}px) saturate(1.6)` }
              : undefined),
          }}
        />
        {barRim ? (
          <svg aria-hidden="true" className="pointer-events-none absolute -inset-px size-[calc(100%+2px)]" viewBox={`0 0 ${bar.width + 2} ${bar.height + 2}`}>
            <path d={barRim} transform="translate(0.5 0.5)" fill="none" stroke="#fff" strokeWidth="1" className="opacity-100 dark:opacity-15" />
          </svg>
        ) : null}
        {pill.width ? (
          <div
            aria-hidden="true"
            className={cn(
              "absolute top-1 left-0 bg-tab-pill transition-[transform,opacity] duration-350 ease-[cubic-bezier(0.22,0.61,0.36,1)] will-change-transform motion-reduce:duration-150",
              activeIndex < 0 && "opacity-0",
            )}
            style={{
              width: pill.width,
              height: pill.height,
              transform: `translate3d(${pill.x}px, 0, 0)`,
              clipPath: `path("${smoothCapsule(pill.width, pill.height)}")`,
            }}
          />
        ) : null}
      {/* The slots inset from the bar by 6, so the first and last pill (the slot + 2 each side) land 4 from the ends. */}
      <ul
        style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` } as CSSProperties}
        className="relative grid h-full px-1.5"
      >
        {mobileNavigationItems.map((item, index) => {
          const isActive = menuUrlFor(activePathname) === item.url
          const Icon = item.tabIcon

          return (
            <li key={item.url} className="relative min-w-0">
              <Link
                ref={(node) => {
                  tabRefs.current[index] = node
                }}
                href={item.url}
                onTouchStart={() => {
                  touchPreviewPathnameRef.current = item.url
                  setVisualPathname(item.url)
                }}
                // Like a native control, the pill follows the finger off the
                // tab and back, and the tab switches only if it lifts there.
                onTouchMove={(event) => {
                  const previewPathname = isTouchOnItem(event) ? item.url : null

                  if (previewPathname !== touchPreviewPathnameRef.current) {
                    touchPreviewPathnameRef.current = previewPathname
                    setVisualPathname(previewPathname ?? restingPathname())
                  }
                }}
                onTouchEnd={(event) => {
                  // Not cancelable once the browser has taken the touch as a
                  // scroll; then it sends no click either.
                  if (event.cancelable) event.preventDefault()
                  touchPreviewPathnameRef.current = null

                  if (isTouchOnItem(event)) {
                    requestNavigation(item.url)
                  } else {
                    setVisualPathname(restingPathname())
                  }
                }}
                onTouchCancel={() => {
                  touchPreviewPathnameRef.current = null
                  setVisualPathname(restingPathname())
                }}
                onClick={(event) => navigateTo(event, item.url)}
                aria-current={pathname === item.url ? "page" : undefined}
                className={cn(
                  tabClassName,
                  // The chosen tab in iOS blue, the others in full ink, as the kit (Accents/Blue).
                  isActive ? "text-tab-active" : "text-foreground",
                )}
              >
                {/* On a layer of its own, so the pill sliding past does not shake it; every glyph in the same 28 box so the row lines up. */}
                <span className="flex size-7 shrink-0 items-center justify-center [backface-visibility:hidden] [transform:translateZ(0)]">
                  <Icon size={GLYPH_SIZE[item.url] ?? 26} weight="fill" aria-hidden="true" />
                </span>
                <span className={labelClassName}>{item.mobileTitle}</span>
              </Link>
            </li>
          )
        })}
        {/* Timi, the fifth slot: an action, not a page, so it never takes the pill; the four-point star (Remix Bard) chosen 2026-10-20. */}
        <li className="relative min-w-0">
          <button type="button" onClick={openAssistant} aria-label="Hỏi Timi, trợ lý AI" className={cn(tabClassName, "w-full text-foreground active:opacity-60")}>
            <span className="flex size-7 shrink-0 items-center justify-center [backface-visibility:hidden] [transform:translateZ(0)]">
              <RiBardFill size={26} aria-hidden="true" />
            </span>
            <span className={labelClassName}>Timi</span>
          </button>
        </li>
      </ul>
      </div>
    </nav>
  )
}
