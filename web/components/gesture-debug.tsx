"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

/**
 * Temporary: an on-screen log of touches and sheets, to see on a real
 * iPhone why a sheet closes by itself. Off unless a page is opened with
 * ?debug=1 (kept in localStorage until ?debug=0). Logs each touch and
 * pointer, whether a click followed, what was under the finger, scrolling,
 * late frames, route changes, every sheet opening, closing and being
 * dragged (vaul), and Radix's "pointer down outside" and "focus outside"
 * events, which dismiss a sheet. "Copy log" puts it all on the clipboard.
 */
const KEY = "gestureDebug"
const MAX_LINES = 10
/** Kept for the copy button. */
const MAX_KEPT = 600

/** iOS Safari before 13.4 has no clipboard API; a selected textarea works everywhere. */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.opacity = "0"
    document.body.append(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

function describe(node: EventTarget | Element | null) {
  if (!(node instanceof Element)) return String(node)
  const el = node.closest("a,button,[role=button],[role=radio],[role=tab],[data-vaul-overlay],[data-slot=drawer-overlay]") ?? node
  if (el.matches("[data-vaul-overlay],[data-slot=drawer-overlay]")) return "OVERLAY"
  const text = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 18)
  return `${el.tagName.toLowerCase()} "${text}"`
}

/** A sheet's name: its title, else its first words. */
function sheetName(drawer: Element) {
  const title = drawer.querySelector("[data-slot=drawer-title]") ?? drawer.querySelector("h2,[role=heading]")
  return `«${(title?.textContent || drawer.textContent || "?").trim().replace(/\s+/g, " ").slice(0, 22)}»`
}

export function GestureDebug() {
  const pathname = usePathname()
  const [enabled, setEnabled] = React.useState(false)
  const [lines, setLines] = React.useState<string[]>([])
  const [minimised, setMinimised] = React.useState(false)
  const startRef = React.useRef(0)
  const keptRef = React.useRef<string[]>([])
  const [copied, setCopied] = React.useState<"" | "ok" | "fail">("")

  const log = React.useCallback((line: string) => {
    const t = ((performance.now() - startRef.current) / 1000).toFixed(2)
    const entry = `${t} ${line}`
    keptRef.current = [...keptRef.current.slice(-(MAX_KEPT - 1)), entry]
    setLines((current) => [...current.slice(-(MAX_LINES - 1)), entry])
  }, [])

  const copyLog = async () => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    const header = [
      navigator.userAgent,
      `${standalone ? "app đã cài" : "trình duyệt"} · ${window.innerWidth}×${window.innerHeight} · ${new Date().toISOString()}`,
    ]
    const ok = await copyText([...header, ...keptRef.current].join("\n"))
    setCopied(ok ? "ok" : "fail")
    window.setTimeout(() => setCopied(""), 2000)
  }

  const clearLog = () => {
    keptRef.current = []
    setLines([])
  }

  React.useEffect(() => {
    try {
      const flag = new URLSearchParams(window.location.search).get("debug")
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

    const inPanel = (event: Event) => event.target instanceof Element && event.target.closest("[data-gesture-debug]")

    const onTouchStart = (event: TouchEvent) => {
      if (inPanel(event)) return
      const touch = event.touches[0]
      if (!touch) return
      touchStartAt = performance.now()
      startX = touch.clientX
      startY = touch.clientY
      moved = 0
      clickSinceTouch = false
      const under = document.elementFromPoint(touch.clientX, touch.clientY)
      const sameAsTarget = under === event.target || (event.target instanceof Node && under?.contains(event.target))
      log(`▼ touch ${Math.round(startX)},${Math.round(startY)} ${describe(event.target)}${sameAsTarget ? "" : ` · TOP ${describe(under)}`}`)
    }
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) moved = Math.max(moved, Math.hypot(touch.clientX - startX, touch.clientY - startY))
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (inPanel(event)) return
      const held = Math.round(performance.now() - touchStartAt)
      window.setTimeout(() => log(`▲ end ${held}ms moved ${Math.round(moved)}px${event.defaultPrevented ? " PREVENTED" : ""}`), 0)
      window.setTimeout(() => {
        if (!clickSinceTouch) log("✗ no click")
      }, 600)
    }
    const onTouchCancel = (event: TouchEvent) => {
      if (!inPanel(event)) log("✗ touchcancel")
    }
    const onPointerCancel = (event: PointerEvent) => {
      if (!inPanel(event)) log(`✗ pointercancel ${describe(event.target)}`)
    }
    const onClick = (event: MouseEvent) => {
      if (inPanel(event)) return
      clickSinceTouch = true
      const late = Math.round(performance.now() - touchStartAt)
      window.setTimeout(() => log(`● click ${describe(event.target)} +${late}ms`), 0)
    }
    // Radix dismisses a sheet on these; read after its handlers, so a prevented one shows.
    const onOutside = (kind: string) => (event: Event) => {
      const original = (event as CustomEvent<{ originalEvent: Event }>).detail?.originalEvent
      window.setTimeout(
        () => log(`◆ ${kind} ${describe(original?.target ?? event.target)}${event.defaultPrevented ? " (ignored)" : " → DISMISS"}`),
        0,
      )
    }
    const onPointerDownOutside = onOutside("pointerDownOutside")
    const onFocusOutside = onOutside("focusOutside")
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") log("⌨ Escape")
    }

    // Sheets (vaul): open and close from data-state, dragging from its class.
    const states = new WeakMap<Element, string>()
    const dragging = new WeakSet<Element>()
    const watch = (drawer: Element) => {
      const state = drawer.getAttribute("data-state") ?? "?"
      if (states.get(drawer) !== state) {
        states.set(drawer, state)
        log(`${state === "open" ? "▣ open" : "▢ close"} ${sheetName(drawer)}`)
      }
      const isDragging = drawer.classList.contains("vaul-dragging")
      if (isDragging && !dragging.has(drawer)) {
        dragging.add(drawer)
        log(`⇣ drag start ${sheetName(drawer)}`)
      } else if (!isDragging && dragging.has(drawer)) {
        dragging.delete(drawer)
        log(`⇡ drag end ${sheetName(drawer)} at ${getComputedStyle(drawer).transform}`)
      }
    }
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target
        if (target instanceof Element && target.matches("[data-vaul-drawer]")) watch(target)
        for (const node of record.addedNodes) {
          if (node instanceof Element) node.querySelectorAll("[data-vaul-drawer]").forEach(watch)
          if (node instanceof Element && node.matches("[data-vaul-drawer]")) watch(node)
        }
        for (const node of record.removedNodes) {
          if (node instanceof Element && (node.matches("[data-vaul-drawer]") || node.querySelector("[data-vaul-drawer]"))) {
            log("✕ sheet removed")
          }
        }
      }
    })
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state", "class"] })

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

    // Safari has no longtask entries: a frame over 120ms late means the page was busy.
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
    document.addEventListener("pointercancel", onPointerCancel, options)
    document.addEventListener("click", onClick, true)
    document.addEventListener("dismissableLayer.pointerDownOutside", onPointerDownOutside, true)
    document.addEventListener("dismissableLayer.focusOutside", onFocusOutside, true)
    document.addEventListener("keydown", onKeyDown, true)
    viewport?.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(scrollTimer)
      observer.disconnect()
      document.removeEventListener("touchstart", onTouchStart, options)
      document.removeEventListener("touchmove", onTouchMove, options)
      document.removeEventListener("touchend", onTouchEnd, options)
      document.removeEventListener("touchcancel", onTouchCancel, options)
      document.removeEventListener("pointercancel", onPointerCancel, options)
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("dismissableLayer.pointerDownOutside", onPointerDownOutside, true)
      document.removeEventListener("dismissableLayer.focusOutside", onFocusOutside, true)
      document.removeEventListener("keydown", onKeyDown, true)
      viewport?.removeEventListener("scroll", onScroll)
    }
  }, [enabled, log])

  React.useEffect(() => {
    if (enabled) log(`→ route ${pathname}`)
  }, [enabled, log, pathname])

  if (!enabled) return null

  return (
    <div
      data-gesture-debug
      className="pointer-events-none fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-[200] rounded-lg bg-black/80 p-2 font-mono text-[10px] leading-tight text-white"
    >
      {minimised ? null : lines.map((line, index) => (
        <div key={index} className="truncate">
          {line}
        </div>
      ))}
      {/* A press here never reaches Radix's listener on the document, so it does not dismiss the open sheet. */}
      <div
        className="pointer-events-auto mt-1 flex gap-2 font-sans text-xs font-medium"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={copyLog} className="min-h-11 grow rounded-md bg-white/20 px-3 active:bg-white/35">
          {copied === "ok" ? "Đã copy" : copied === "fail" ? "Không copy được" : "Copy log"}
        </button>
        <button type="button" onClick={clearLog} className="min-h-11 rounded-md bg-white/20 px-3 active:bg-white/35">
          Xoá
        </button>
        <button type="button" onClick={() => setMinimised((value) => !value)} className="min-h-11 rounded-md bg-white/20 px-3 active:bg-white/35">
          {minimised ? "Hiện" : "Thu"}
        </button>
      </div>
    </div>
  )
}
