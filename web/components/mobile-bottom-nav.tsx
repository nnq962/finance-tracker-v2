"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  type CSSProperties,
  type MouseEvent,
  type TouchEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { cn } from "cn"
import { SettingsIcon } from "lucide-react"

import { appNavigationItems, menuUrlFor } from "@/lib/app-navigation"
import { smoothCapsule } from "@/lib/smooth-capsule"

const mobileNavigationItems = [
  ...appNavigationItems,
  { title: "Cài đặt", mobileTitle: "Cài đặt", url: "/settings", icon: SettingsIcon },
]

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
      // Measured from the bar: each tab sits in an item of its own.
      const box = tab.getBoundingClientRect()
      setPill({
        x: Math.round(box.left - element.getBoundingClientRect().left),
        width: Math.round(box.width),
        height: Math.round(box.height),
      })
    }
  }, [activeIndex, bar.width])
  const barOutline = bar.width ? smoothCapsule(bar.width, bar.height) : ""
  // The edge's line, half a pixel in all round, so the whole 1px stroke lies
  // inside the bar: on the outline itself, its outer half was cut off along
  // the straight edges and not on the bends, which looked thicker.
  const barEdge = bar.width ? smoothCapsule(bar.width - 1, bar.height - 1) : ""

  return (
    // Icons on a capsule across the screen, floating over the page;
    // the shell reserves its height in --tab-bar-space so the end of a page
    // can scroll above it. A screen that takes the whole height for a while
    // (searching) slides it off the bottom by rendering an element with
    // data-hide-tab-bar; it turns invisible once out of view, so it leaves the
    // tab order too, and slides back when that element goes.
    <nav
      aria-label="Điều hướng chính trên di động"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)-0.75rem))] transition-[translate,visibility] duration-300 ease-out motion-reduce:transition-none md:hidden [body:has([data-hide-tab-bar])_&]:invisible [body:has([data-hide-tab-bar])_&]:translate-y-full"
    >
      {/* iOS 26's tab bar (2026-10-11): a white capsule with continuous ends,
          raised by a wide soft shadow, the current tab on a grey pill nearly
          as tall, icons in ink. The capsule, its edge and the pill are layers
          of their own behind the icons: with the blur on the list itself,
          Safari redrew the icons as the pill slid and they shook. */}
      <div ref={barRef} className="pointer-events-auto relative isolate mx-auto h-15 w-full max-w-md">
        {/* The shadow on a plain capsule: blurred this wide, the ends' shape does not show in it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 rounded-full shadow-[0_14px_44px_rgb(0_0_0/0.16),0_2px_8px_rgb(0_0_0/0.06)] dark:shadow-[0_14px_44px_rgb(0_0_0/0.5)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-card/95 backdrop-blur-xl backdrop-saturate-150"
          style={barOutline ? { clipPath: `path("${barOutline}")`, borderRadius: 0 } : undefined}
        />
        {barOutline ? (
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${bar.width} ${bar.height}`}>
            <path
              d={barEdge}
              transform="translate(0.5 0.5)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground/5 dark:text-foreground/10"
            />
          </svg>
        ) : null}
        {pill.width ? (
          <div
            aria-hidden="true"
            className={cn(
              "absolute top-1 left-0 bg-foreground/8 transition-[transform,opacity] duration-350 ease-[cubic-bezier(0.22,0.61,0.36,1)] will-change-transform motion-reduce:duration-150 dark:bg-foreground/13",
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
      <ul
        style={{ gridTemplateColumns: `repeat(${mobileNavigationItems.length}, minmax(0, 1fr))` } as CSSProperties}
        className="relative grid h-full p-1"
      >
        {mobileNavigationItems.map((item, index) => {
          const isActive = menuUrlFor(activePathname) === item.url
          const Icon = item.icon

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
                  "flex h-13 min-w-0 touch-manipulation items-center justify-center rounded-full text-foreground outline-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                {/* On a layer of its own, so the pill sliding past does not shake it. */}
                <Icon
                  className="size-6 shrink-0 [backface-visibility:hidden] [transform:translateZ(0)]"
                  strokeWidth={isActive ? 2.4 : 1.75}
                  aria-hidden="true"
                />
                {/* Icons alone on screen; the name is still each tab's accessible name. */}
                <span className="sr-only">{item.mobileTitle}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      </div>
    </nav>
  )
}
