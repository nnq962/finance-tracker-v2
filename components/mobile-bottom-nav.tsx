"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useOptimistic, useRef, useTransition } from "react"
import { cn } from "cn"
import { useReducedMotion } from "motion/react"

import {
  Highlight,
  HighlightItem,
} from "@/components/animate-ui/primitives/effects/highlight"
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
  const [activePathname, setActivePathname] = useOptimistic(pathname)
  const [, startNavigation] = useTransition()
  const navRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const nav = navRef.current

    if (!nav || !isIOSStandalone()) {
      return
    }

    let animationFrame = 0
    let bottomOffset = false
    let lastRepaint = 0
    let restoreViewportTimeout = 0
    let orientationTimeout = 0
    let healthyViewportWidth = window.innerWidth

    const repaintNav = () => {
      if (animationFrame) {
        return
      }

      animationFrame = window.requestAnimationFrame((timestamp) => {
        animationFrame = 0

        // iOS standalone PWAs can visually detach fixed elements while the page
        // scrolls. A tiny position change makes WebKit re-anchor this layer.
        if (timestamp - lastRepaint < 24) {
          return
        }

        lastRepaint = timestamp
        bottomOffset = !bottomOffset
        nav.style.bottom = bottomOffset ? "0.01px" : "0px"
        nav.getBoundingClientRect()
      })
    }

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
            repaintNav()
          }, 50)

          return
        }
      }

      healthyViewportWidth = currentWidth
      repaintNav()
    }

    const handleOrientationChange = () => {
      window.clearTimeout(orientationTimeout)
      orientationTimeout = window.setTimeout(() => {
        healthyViewportWidth = window.innerWidth
        repaintNav()
      }, 250)
    }

    window.addEventListener("scroll", repaintNav, { passive: true })
    window.addEventListener("pageshow", recoverViewport)
    window.addEventListener("orientationchange", handleOrientationChange)
    document.addEventListener("visibilitychange", recoverViewport)
    window.visualViewport?.addEventListener("scroll", repaintNav)
    window.visualViewport?.addEventListener("resize", repaintNav)

    repaintNav()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(restoreViewportTimeout)
      window.clearTimeout(orientationTimeout)
      window.removeEventListener("scroll", repaintNav)
      window.removeEventListener("pageshow", recoverViewport)
      window.removeEventListener("orientationchange", handleOrientationChange)
      document.removeEventListener("visibilitychange", recoverViewport)
      window.visualViewport?.removeEventListener("scroll", repaintNav)
      window.visualViewport?.removeEventListener("resize", repaintNav)
      nav.style.removeProperty("bottom")
    }
  }, [])

  return (
    <nav
      ref={navRef}
      aria-label="Điều hướng chính trên di động"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#e7e4dd] bg-white px-3 pt-1.5 [padding-bottom:env(safe-area-inset-bottom,0px)] dark:border-[#35323e] dark:bg-[#201e26] md:hidden"
    >
      <Highlight
        controlledItems
        value={activePathname}
        click={false}
        animatePresence={false}
        className="inset-0 rounded-xl bg-[#d6f4ff] dark:bg-[#113950]"
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 350, damping: 26 }
        }
      >
        <ul className="mx-auto grid max-w-md grid-cols-4 gap-0.5">
          {appNavigationItems.map((item) => {
            const isActive = activePathname === item.url
            const Icon = item.icon

            return (
              <HighlightItem
                key={item.url}
                as="li"
                value={item.url}
                className="min-w-0"
              >
                <Link
                  href={item.url}
                  onNavigate={(event) => {
                    event.preventDefault()
                    startNavigation(() => {
                      setActivePathname(item.url)
                      router.push(item.url)
                    })
                  }}
                  aria-current={pathname === item.url ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-muted-foreground transition-colors outline-none select-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-[#38b8f6] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#201e26]",
                    isActive && "text-[#0083c4] dark:text-[#78d0ff]",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="max-w-full truncate font-heading text-[0.65rem] leading-none font-extrabold">
                    {item.mobileTitle}
                  </span>
                </Link>
              </HighlightItem>
            )
          })}
        </ul>
      </Highlight>
    </nav>
  )
}
