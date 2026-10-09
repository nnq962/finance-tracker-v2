"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

/**
 * Temporary: a log of taps on screen, to see on a real phone why a tap does
 * not open a page. Off unless a page is opened with ?tapdebug=1 (kept in
 * localStorage until ?tapdebug=0). Logs each touch, whether the browser sent
 * a click for it, what was under the finger, scrolling, frames the page took
 * too long to draw, and when the route changed.
 */
const KEY = "tapDebug"
const MAX_LINES = 18

function describe(node: EventTarget | Element | null) {
  if (!(node instanceof Element)) return String(node)
  const el = node.closest("a,button,[role=button],[role=radio],[role=tab]") ?? node
  const text = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 18)
  const tag = el.tagName.toLowerCase()
  const href = el.getAttribute("href")
  return `${tag}${href ? `[${href}]` : ""} "${text}"`
}

export function TapDebug() {
  const pathname = usePathname()
  const [enabled, setEnabled] = React.useState(false)
  const [lines, setLines] = React.useState<string[]>([])
  const startRef = React.useRef(0)
  const lastClickRef = React.useRef<number | null>(null)

  const log = React.useCallback((line: string) => {
    const t = ((performance.now() - startRef.current) / 1000).toFixed(2)
    setLines((current) => [...current.slice(-(MAX_LINES - 1)), `${t} ${line}`])
  }, [])

  React.useEffect(() => {
    try {
      const flag = new URLSearchParams(window.location.search).get("tapdebug")
      if (flag === "1") localStorage.setItem(KEY, "1")
      if (flag === "0") localStorage.removeItem(KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(localStorage.getItem(KEY) === "1")
    } catch {
      // Storage blocked: stays off.
    }
  }, [])

  React.useEffect(() => {
    if (!enabled) return
    startRef.current = performance.now()
    let touchStartAt = 0
    let moved = 0
    let startX = 0
    let startY = 0
    let clickSinceTouch = false

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      touchStartAt = performance.now()
      startX = touch.clientX
      startY = touch.clientY
      moved = 0
      clickSinceTouch = false
      const under = document.elementFromPoint(touch.clientX, touch.clientY)
      const sameAsTarget = under === event.target || (event.target instanceof Node && under?.contains(event.target))
      log(`▼ start ${describe(event.target)}${sameAsTarget ? "" : ` · TOP IS ${describe(under)}`}`)
    }
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) moved = Math.max(moved, Math.hypot(touch.clientX - startX, touch.clientY - startY))
    }
    const onTouchEnd = (event: TouchEvent) => {
      const held = Math.round(performance.now() - touchStartAt)
      // Read after every handler has run, so a preventDefault shows.
      window.setTimeout(() => {
        log(`▲ end ${held}ms moved ${Math.round(moved)}px${event.defaultPrevented ? " PREVENTED" : ""}`)
      }, 0)
      window.setTimeout(() => {
        if (!clickSinceTouch) log("✗ NO CLICK for this touch")
      }, 600)
    }
    const onTouchCancel = () => log("✗ touchcancel (browser took it as scroll)")
    const onClick = (event: MouseEvent) => {
      clickSinceTouch = true
      lastClickRef.current = performance.now()
      const late = Math.round(performance.now() - touchStartAt)
      window.setTimeout(() => {
        log(`● click ${describe(event.target)} +${late}ms${event.defaultPrevented ? " (handled)" : ""}`)
      }, 0)
    }

    const viewport = document.querySelector<HTMLElement>("[data-main-scroll-viewport]")
    let scrollTimer = 0
    let scrolling = false
    const onScroll = () => {
      if (!scrolling) log("~ scroll start")
      scrolling = true
      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => {
        scrolling = false
        log("~ scroll end")
      }, 150)
    }

    // Safari has no longtask entries: a frame that came over 120ms late
    // means the page was busy and could not answer a tap.
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const gap = now - last
      if (gap > 120) log(`! busy ${Math.round(gap)}ms`)
      last = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const options = { capture: true, passive: true } as const
    document.addEventListener("touchstart", onTouchStart, options)
    document.addEventListener("touchmove", onTouchMove, options)
    document.addEventListener("touchend", onTouchEnd, options)
    document.addEventListener("touchcancel", onTouchCancel, options)
    document.addEventListener("click", onClick, true)
    viewport?.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(scrollTimer)
      document.removeEventListener("touchstart", onTouchStart, options)
      document.removeEventListener("touchmove", onTouchMove, options)
      document.removeEventListener("touchend", onTouchEnd, options)
      document.removeEventListener("touchcancel", onTouchCancel, options)
      document.removeEventListener("click", onClick, true)
      viewport?.removeEventListener("scroll", onScroll)
    }
  }, [enabled, log])

  React.useEffect(() => {
    if (!enabled) return
    const since = lastClickRef.current
     
    log(`→ route ${pathname}${since !== null ? ` ${Math.round(performance.now() - since)}ms after last click` : ""}`)
    lastClickRef.current = null
  }, [enabled, log, pathname])

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed inset-x-2 top-[calc(env(safe-area-inset-top,0px)+3rem)] z-[200] rounded-lg bg-foreground/85 p-2 font-mono text-[10px] leading-tight text-background">
      {lines.map((line, index) => (
        <div key={index} className="truncate">
          {line}
        </div>
      ))}
    </div>
  )
}
