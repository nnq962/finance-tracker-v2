"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { cn } from "cn"
import { SettingsIcon } from "lucide-react"

import { appNavigationItems, designNavigationItems } from "@/lib/app-navigation"

const mobileNavigationItems = [
  ...appNavigationItems,
  { title: "Cài đặt", mobileTitle: "Cài đặt", url: "/settings", icon: SettingsIcon },
  ...designNavigationItems,
]

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

  useEffect(() => {
    const scrollViewport = document.querySelector<HTMLElement>(
      "[data-main-scroll-viewport]",
    )

    if (scrollViewport) {
      scrollViewport.scrollTop = 0
    }
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
        router.replace(requestedPathname)
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

  const requestNavigation = (requestedPathname: string) => {
    if (
      (!navigationInFlightRef.current && requestedPathname === pathname) ||
      (navigationInFlightRef.current &&
        requestedPathname === latestRequestedPathnameRef.current)
    ) {
      return
    }

    const shouldReplace = navigationInFlightRef.current

    navigationInFlightRef.current = true
    latestRequestedPathnameRef.current = requestedPathname
    recoveryPathnameRef.current = null
    setVisualPathname(requestedPathname)

    startNavigation(() => {
      if (shouldReplace) {
        router.replace(requestedPathname)
      } else {
        router.push(requestedPathname)
      }
    })
  }

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

  const activeIndex = mobileNavigationItems.findIndex((item) => item.url === activePathname)

  return (
    // Floats over the page, clear of the screen's edges; the shell reserves
    // its height in --tab-bar-space so the end of a page can scroll above it.
    <nav
      aria-label="Điều hướng chính trên di động"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:hidden"
    >
      <ul
        style={{ gridTemplateColumns: `repeat(${mobileNavigationItems.length}, minmax(0, 1fr))` }}
        className="pointer-events-auto relative mx-auto grid max-w-md rounded-full bg-card/80 p-1 shadow-lg ring-1 ring-foreground/5 backdrop-blur-xl backdrop-saturate-150 dark:ring-foreground/10">
        {/* The pill behind the current tab slides from tab to tab. */}
        <li
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/var(--tab-count))] rounded-full bg-muted transition-[translate,opacity] duration-300 ease-out motion-reduce:duration-150",
            activeIndex < 0 && "opacity-0",
          )}
          style={
            {
              "--tab-count": mobileNavigationItems.length,
              translate: `${Math.max(activeIndex, 0) * 100}% 0`,
            } as CSSProperties
          }
        />
        {mobileNavigationItems.map((item) => {
          const isActive = activePathname === item.url
          const Icon = item.icon

          return (
            <li key={item.url} className="relative min-w-0">
              <Link
                href={item.url}
                aria-label={item.mobileTitle}
                onTouchStart={() => {
                  touchPreviewPathnameRef.current = item.url
                  setVisualPathname(item.url)
                }}
                onTouchEnd={(event) => {
                  event.preventDefault()
                  touchPreviewPathnameRef.current = null
                  requestNavigation(item.url)
                }}
                onTouchCancel={() => {
                  touchPreviewPathnameRef.current = null
                  setVisualPathname(
                    navigationInFlightRef.current
                      ? latestRequestedPathnameRef.current
                      : pathname,
                  )
                }}
                onClick={(event) => navigateTo(event, item.url)}
                aria-current={pathname === item.url ? "page" : undefined}
                className={cn(
                  "flex min-h-14 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-full text-muted-foreground transition-colors outline-none select-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive && "text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="max-w-full truncate text-[11px] font-medium max-[359px]:hidden">
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
