"use client"

import * as React from "react"

/**
 * Temporary (2026-10-17): an on-screen log of how pages load and change on
 * a real iPhone, to find where a tab switch or a sign in waits. Off unless a
 * page is opened with ?debug=1 (kept until ?debug=0). Logs each full page
 * load with its timings, taps, URL changes, skeletons and content appearing,
 * sheets, toasts, the session cover, every request to the server with how
 * long it took, code loaded later, the app leaving and coming back, and
 * errors. The log survives reloads (localStorage); "Copy" puts it all on the
 * clipboard to send.
 */
const KEY = "perfDebug"
const STORE = "perfDebugLog"
const SHOWN = 12
const KEPT = 800

let kept: string[] = []
let lastTap = 0
const listeners = new Set<() => void>()

function stamp(time: number) {
  const date = new Date(time)
  const pad = (value: number, size = 2) => String(value).padStart(size, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

function sinceTap() {
  return lastTap ? ` [+${Date.now() - lastTap}ms sau chạm]` : ""
}

function log(text: string) {
  kept.push(`${stamp(Date.now())} ${text}`)
  if (kept.length > KEPT) kept = kept.slice(-KEPT)
  try {
    localStorage.setItem(STORE, JSON.stringify(kept))
  } catch {
    // Storage full or blocked: the log still shows on screen.
  }
  for (const listener of listeners) listener()
}

const ms = (value: number) => `${Math.round(value)}ms`

function describe(node: EventTarget | null) {
  if (!(node instanceof Element)) return "?"
  const el = node.closest("a,button,[role=button],[role=radio],[role=tab]") ?? node
  const text = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24)
  const href = el instanceof HTMLAnchorElement ? ` → ${new URL(el.href).pathname}` : ""
  return `${el.tagName.toLowerCase()} "${text}"${href}`
}

function sheetName(sheet: Element) {
  const title = sheet.querySelector("[data-slot=drawer-title],[data-slot=dialog-title],h2")
  return `«${(title?.textContent || "?").trim().replace(/\s+/g, " ").slice(0, 24)}»`
}

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

/** Starts every listener; returns what stops them. */
function startLogging() {
  const stops: (() => void)[] = []
  const on = <T extends EventTarget>(target: T, type: string, handler: (event: Event) => void, capture = true) => {
    target.addEventListener(type, handler, { capture, passive: true })
    stops.push(() => target.removeEventListener(type, handler, { capture }))
  }

  // This page load.
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
  const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true)
  log(
    `=== TẢI TRANG ${location.pathname}${location.search} · ${nav?.type ?? "?"} · v${process.env.NEXT_PUBLIC_APP_VERSION} · ${standalone ? "PWA" : "trình duyệt"} ===`,
  )
  const reportLoad = () => {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
    if (!entry) return
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]
    log(
      `tải trang: kết nối ${ms(entry.connectEnd - entry.startTime)}, chờ server ${ms(entry.responseStart - entry.requestStart)}, HTML xong ${ms(entry.responseEnd)}, ` +
        `FCP ${fcp ? ms(fcp.startTime) : "-"}, DOM xong ${ms(entry.domContentLoadedEventEnd)}, load ${ms(entry.loadEventEnd)}, HTML ${Math.round((entry.transferSize || 0) / 1024)}KB`,
    )
  }
  if (document.readyState === "complete") setTimeout(reportLoad, 0)
  else on(window, "load", () => setTimeout(reportLoad, 0), false)
  log(`hydrate xong lúc ${ms(performance.now())} từ đầu trang`)

  // Taps.
  on(document, "pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest("[data-perf-debug]")) return
    lastTap = Date.now()
    log(`chạm ${describe(event.target)}`)
  })

  // URL changes (Next's router writes them through history).
  let lastUrl = location.pathname + location.search
  const urlChanged = (how: string) => {
    const url = location.pathname + location.search
    if (url === lastUrl) return
    lastUrl = url
    log(`URL ${how} → ${url}${sinceTap()}`)
  }
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method]
    history[method] = function (...args: Parameters<History["pushState"]>) {
      const result = original.apply(this, args)
      urlChanged(method === "pushState" ? "push" : "replace")
      return result
    }
    stops.push(() => {
      history[method] = original
    })
  }
  on(window, "popstate", () => urlChanged("back/forward"), false)

  // What shows: skeletons, the starting screen, sheets, toasts, the session cover.
  let skeletons = -1
  let starting = false
  let sheets = new Set<Element>()
  const toasts = new WeakSet<Element>()
  let scheduled = false
  const look = () => {
    scheduled = false
    // Only what is on screen: hidden copies (the session cover's) do not count.
    const shown = (el: Element) => el.getClientRects().length > 0
    const count = [...document.querySelectorAll("[data-slot=skeleton]")].filter(shown).length
    if (skeletons !== -1 && (count > 0) !== (skeletons > 0)) {
      log(count > 0 ? `skeleton hiện (${count})${sinceTap()}` : `nội dung hiện (hết skeleton)${sinceTap()}`)
    }
    skeletons = count
    const isStarting = [...document.querySelectorAll('[aria-label="Đang khởi động Timi"]')].some(shown)
    if (isStarting !== starting) log(isStarting ? `màn "Đang khởi động" hiện${sinceTap()}` : `màn "Đang khởi động" tắt${sinceTap()}`)
    starting = isStarting
    const open = new Set(document.querySelectorAll("[data-slot=drawer-content][data-state=open],[data-slot=dialog-content][data-state=open]"))
    for (const sheet of open) if (!sheets.has(sheet)) log(`sheet mở ${sheetName(sheet)}${sinceTap()}`)
    for (const sheet of sheets) if (!open.has(sheet)) log(`sheet đóng ${sheetName(sheet)}`)
    sheets = open
    for (const toast of document.querySelectorAll("[data-sonner-toast]")) {
      if (toasts.has(toast)) continue
      toasts.add(toast)
      log(`toast: ${(toast.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60)}${sinceTap()}`)
    }
  }
  const observer = new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(look)
  })
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] })
  stops.push(() => observer.disconnect())
  look()
  const coverObserver = new MutationObserver(() => {
    log(document.documentElement.dataset.sessionCheck === "pending" ? "che màn (kiểm tra phiên)" : "bỏ che màn")
  })
  coverObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-session-check"] })
  stops.push(() => coverObserver.disconnect())

  // Requests: the server's (pages, data, actions), Google's, and code loaded later.
  let lateCode = { files: 0, kb: 0, timer: 0 }
  const resources = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
      const url = new URL(entry.name)
      const kb = Math.round((entry.transferSize || 0) / 1024)
      const wait = entry.responseStart > 0 ? `, chờ ${ms(entry.responseStart - entry.startTime)}` : ""
      if (url.origin === location.origin && (entry.initiatorType === "fetch" || entry.initiatorType === "xmlhttprequest")) {
        const what = url.searchParams.has("_rsc") ? "trang (RSC)" : url.pathname.startsWith("/api/") ? "api" : "action/fetch"
        log(`→ ${what} ${url.pathname} ${ms(entry.duration)}${wait}, ${kb}KB${sinceTap()}`)
      } else if (/google|gstatic|firebase/.test(url.hostname) || url.pathname.startsWith("/__/auth")) {
        log(`→ google ${url.hostname}${url.pathname.slice(0, 40)} ${ms(entry.duration)}${wait}`)
      } else if (url.origin === location.origin && url.pathname.startsWith("/_next/static/") && entry.transferSize > 0) {
        lateCode.files += 1
        lateCode.kb += kb
        window.clearTimeout(lateCode.timer)
        lateCode.timer = window.setTimeout(() => {
          log(`tải code: ${lateCode.files} file, ${lateCode.kb}KB (không có trong cache)`)
          lateCode = { files: 0, kb: 0, timer: 0 }
        }, 800)
      }
    }
  })
  resources.observe({ type: "resource", buffered: false })
  stops.push(() => resources.disconnect())
  try {
    const longTasks = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (entry.duration >= 150) log(`máy bận ${ms(entry.duration)}`)
    })
    longTasks.observe({ type: "longtask", buffered: false })
    stops.push(() => longTasks.disconnect())
  } catch {
    // Safari has no long tasks.
  }

  // The app leaving and coming back.
  let hiddenAt = 0
  on(document, "visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now()
      log("app ẩn")
    } else {
      log(`app hiện lại sau ${hiddenAt ? `${Math.round((Date.now() - hiddenAt) / 1000)}s` : "?"}`)
    }
  })
  on(window, "pageshow", (event) => {
    if ((event as PageTransitionEvent).persisted) log("khôi phục từ bộ nhớ (bfcache)")
  }, false)
  on(window, "focus", () => log("cửa sổ được focus"), false)
  on(window, "blur", () => log("cửa sổ mất focus"), false)
  on(window, "online", () => log("có mạng"), false)
  on(window, "offline", () => log("mất mạng"), false)

  // Errors.
  on(window, "error", (event) => log(`LỖI: ${(event as ErrorEvent).message?.slice(0, 160)}`), false)
  on(window, "unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason
    log(`LỖI (promise): ${String(reason?.message ?? reason).slice(0, 160)}`)
  }, false)

  return () => {
    for (const stop of stops) stop()
  }
}

export function PerfDebug() {
  const [enabled, setEnabled] = React.useState(false)
  const [, setVersion] = React.useState(0)
  const [open, setOpen] = React.useState(true)
  const [copied, setCopied] = React.useState<"ok" | "fail" | null>(null)

  React.useEffect(() => {
    try {
      const flag = new URLSearchParams(location.search).get("debug")
      if (flag === "1") localStorage.setItem(KEY, "1")
      if (flag === "0") {
        localStorage.removeItem(KEY)
        localStorage.removeItem(STORE)
      }
      if (localStorage.getItem(KEY) !== "1") return
      kept = JSON.parse(localStorage.getItem(STORE) ?? "[]") as string[]
    } catch {
      return
    }
    const render = () => setVersion((value) => value + 1)
    listeners.add(render)
    const stop = startLogging()
    // Read from localStorage, which the server cannot see: known only after mounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true)
    return () => {
      listeners.delete(render)
      stop()
    }
  }, [])

  if (!enabled) return null

  const copyLog = async () => {
    const header = `Timi v${process.env.NEXT_PUBLIC_APP_VERSION} · ${navigator.userAgent} · ${screen.width}x${screen.height}`
    const ok = await copyText([header, ...kept].join("\n"))
    setCopied(ok ? "ok" : "fail")
    window.setTimeout(() => setCopied(null), 2000)
  }
  const clearLog = () => {
    kept = []
    try {
      localStorage.setItem(STORE, "[]")
    } catch {
      // ignore
    }
    log("(đã xoá log)")
  }
  const turnOff = () => {
    try {
      localStorage.removeItem(KEY)
      localStorage.removeItem(STORE)
    } catch {
      // ignore
    }
    kept = []
    setEnabled(false)
  }

  return (
    <div
      data-perf-debug
      // Above the tab bar; a press here never reaches a sheet's outside listener.
      onPointerDown={(event) => event.stopPropagation()}
      className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-[200] rounded-lg bg-black/80 p-2 font-mono text-[10px] leading-tight text-white"
    >
      {open
        ? kept.slice(-SHOWN).map((line, index) => (
            <div key={index} className="truncate">
              {line}
            </div>
          ))
        : null}
      <div className="mt-1 flex gap-2 font-sans text-xs font-medium">
        <button type="button" onClick={copyLog} className="min-h-11 grow rounded-md bg-white/20 px-3 active:bg-white/35">
          {copied === "ok" ? "Đã copy" : copied === "fail" ? "Không copy được" : `Copy log (${kept.length})`}
        </button>
        <button type="button" onClick={clearLog} className="min-h-11 rounded-md bg-white/20 px-3 active:bg-white/35">
          Xoá
        </button>
        <button type="button" onClick={() => setOpen((value) => !value)} className="min-h-11 rounded-md bg-white/20 px-3 active:bg-white/35">
          {open ? "Thu" : "Hiện"}
        </button>
        <button type="button" onClick={turnOff} className="min-h-11 rounded-md bg-white/20 px-3 active:bg-white/35">
          Tắt
        </button>
      </div>
    </div>
  )
}
