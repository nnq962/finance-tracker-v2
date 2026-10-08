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

  return (
    // Icon and name on a capsule across the screen, floating over the page;
    // the shell reserves its height in --tab-bar-space so the end of a page
    // can scroll above it. A screen that takes the whole height for a while
    // (searching) hides it by rendering an element with data-hide-tab-bar.
    <nav
      aria-label="Điều hướng chính trên di động"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:hidden [body:has([data-hide-tab-bar])_&]:hidden"
    >
      <ul
        style={
          {
            "--tab-count": mobileNavigationItems.length,
            gridTemplateColumns: `repeat(${mobileNavigationItems.length}, minmax(0, 1fr))`,
          } as CSSProperties
        }
        className="pointer-events-auto relative mx-auto grid w-full max-w-md rounded-full bg-card/85 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.10)] backdrop-blur-xl backdrop-saturate-150 dark:ring-1 dark:ring-foreground/10">
        {/* A light pill behind the current tab slides from tab to tab. */}
        <li
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/var(--tab-count))] rounded-full bg-foreground/[0.06] transition-[translate,opacity] duration-300 ease-out motion-reduce:duration-150 dark:bg-foreground/10",
            activeIndex < 0 && "opacity-0",
          )}
          style={{ translate: `${Math.max(activeIndex, 0) * 100}% 0` }}
        />
        {mobileNavigationItems.map((item) => {
          const isActive = menuUrlFor(activePathname) === item.url
          const Icon = item.icon

          return (
            <li key={item.url} className="relative min-w-0">
              <Link
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
                  "flex h-[52px] min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-full text-muted-foreground transition-colors duration-300 outline-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:duration-150",
                  isActive && "text-foreground",
                )}
              >
                <Icon className="size-[22px] shrink-0" strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" />
                <span className={cn("max-w-full truncate text-[11px] leading-none font-medium tracking-tight", isActive && "font-semibold")}>
                  {item.mobileTitle}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
