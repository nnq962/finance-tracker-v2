"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  type MouseEvent,
  useEffect,
  useOptimistic,
  useRef,
  useTransition,
} from "react"
import { cn } from "cn"

import { appNavigationItems } from "@/lib/app-navigation"

function isIOSStandalone() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean
  }
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

  return (
    isIOS &&
    (navigatorWithStandalone.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches)
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [activePathname, setOptimisticPathname] = useOptimistic(pathname)
  const [isNavigationPending, startNavigation] = useTransition()
  const latestRequestedPathnameRef = useRef(pathname)
  const navigationInFlightRef = useRef(false)
  const recoveryPathnameRef = useRef<string | null>(null)
  const activeIndex = Math.max(
    appNavigationItems.findIndex((item) => item.url === activePathname),
    0,
  )

  useEffect(() => {
    if (isNavigationPending) {
      return
    }

    if (!navigationInFlightRef.current) {
      latestRequestedPathnameRef.current = pathname
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
        setOptimisticPathname(requestedPathname)
        router.replace(requestedPathname)
      })
      return
    }

    navigationInFlightRef.current = false
    recoveryPathnameRef.current = null
    latestRequestedPathnameRef.current = pathname
  }, [isNavigationPending, pathname, router, setOptimisticPathname])

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

    startNavigation(() => {
      setOptimisticPathname(requestedPathname)

      if (shouldReplace) {
        router.replace(requestedPathname)
      } else {
        router.push(requestedPathname)
      }
    })
  }

  useEffect(() => {
    if (!isIOSStandalone()) {
      return
    }

    let restoreViewportTimeout = 0
    let orientationTimeout = 0
    let healthyViewportWidth = window.innerWidth

    const recoverViewport = () => {
      if (document.visibilityState !== "visible") {
        return
      }

      const currentWidth = window.innerWidth

      // Some iOS PWA resumes lose viewport-fit and report a wider viewport.
      // Refresh the viewport declaration only when that anomaly is detected.
      if (currentWidth > healthyViewportWidth + 10) {
        const viewportMeta = document.querySelector<HTMLMetaElement>(
          'meta[name="viewport"]'
        )

        if (viewportMeta) {
          const viewportContent = viewportMeta.content

          viewportMeta.content = "width=device-width, initial-scale=1"
          window.clearTimeout(restoreViewportTimeout)
          restoreViewportTimeout = window.setTimeout(() => {
            viewportMeta.content = viewportContent
            healthyViewportWidth = window.innerWidth
          }, 50)

          return
        }
      }

      healthyViewportWidth = currentWidth
    }

    const handleOrientationChange = () => {
      window.clearTimeout(orientationTimeout)
      orientationTimeout = window.setTimeout(() => {
        healthyViewportWidth = window.innerWidth
      }, 250)
    }

    window.addEventListener("pageshow", recoverViewport)
    window.addEventListener("orientationchange", handleOrientationChange)
    document.addEventListener("visibilitychange", recoverViewport)

    return () => {
      window.clearTimeout(restoreViewportTimeout)
      window.clearTimeout(orientationTimeout)
      window.removeEventListener("pageshow", recoverViewport)
      window.removeEventListener("orientationchange", handleOrientationChange)
      document.removeEventListener("visibilitychange", recoverViewport)
    }
  }, [])

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="fixed inset-x-0 bottom-0 z-40 isolate border-t-2 border-[#e7e4dd] bg-white px-3 pt-1.5 [backface-visibility:hidden] [padding-bottom:env(safe-area-inset-bottom,0px)] [transform:translateZ(0)] dark:border-[#35323e] dark:bg-[#201e26] md:hidden"
    >
      <ul className="relative mx-auto grid max-w-md grid-cols-4">
        <li
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 px-0.5 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] [will-change:transform] motion-reduce:duration-0"
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
                onClick={(event) => navigateTo(event, item.url)}
                aria-current={pathname === item.url ? "page" : undefined}
                className={cn(
                  "relative z-10 flex min-h-12 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-muted-foreground outline-none select-none [-webkit-tap-highlight-color:transparent] transition-[color,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-[#38b8f6] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#201e26]",
                  isActive && "text-[#0083c4] dark:text-[#78d0ff]",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform duration-200 ease-out motion-reduce:transition-none",
                    isActive && "-translate-y-0.5 scale-105 motion-reduce:transform-none",
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
