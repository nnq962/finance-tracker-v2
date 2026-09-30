"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  type MouseEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { cn } from "cn"

import { appNavigationItems } from "@/lib/app-navigation"

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
  const activeIndex = Math.max(
    appNavigationItems.findIndex((item) => item.url === activePathname),
    0,
  )

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

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="relative z-40 w-full shrink-0 isolate border-t-2 border-[#e7e4dd] bg-white px-3 pt-1.5 [padding-bottom:env(safe-area-inset-bottom,0px)] dark:border-[#35323e] dark:bg-[#201e26] md:hidden"
    >
      <ul className="relative mx-auto grid max-w-md grid-cols-4">
        <li
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 px-0.5 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] [backface-visibility:hidden] [contain:paint] [will-change:transform] motion-reduce:duration-0"
          style={{ transform: `translate3d(${activeIndex * 100}%, 0, 0)` }}
        >
          <span className="block size-full rounded-xl bg-[#d6f4ff] dark:bg-[#113950]" />
        </li>

        {appNavigationItems.map((item) => {
          const isActive = activePathname === item.url
          const Icon = item.icon

          return (
            <li key={item.url} className="min-w-0 px-0.5">
              <Link
                href={item.url}
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
                  "relative z-10 flex min-h-12 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-muted-foreground outline-none select-none [-webkit-tap-highlight-color:transparent] transition-[color,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-[#38b8f6] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#201e26]",
                  isActive && "text-[#0083c4] dark:text-[#78d0ff]",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0 transform-gpu origin-center transition-transform duration-200 ease-out [backface-visibility:hidden] [will-change:transform] motion-reduce:transition-none",
                    isActive && "scale-105 motion-reduce:transform-none",
                  )}
                  aria-hidden="true"
                />
                <span className="max-w-full truncate font-heading text-[0.65rem] leading-none font-extrabold">
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
