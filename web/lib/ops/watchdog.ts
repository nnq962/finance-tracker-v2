import "server-only"

import { serverState } from "@/lib/server-state"

import { notifyOps, opsEnabled } from "./telegram"

/*
 * Who watches the watcher (2026-10-18): the watcher on the ubuntu machine
 * (deploy/watcher) asks /api/health every minute as "timi-watcher". When it
 * has not for 10 minutes, Timi says so on Telegram (the machine may be off or
 * offline, and Timi's outages would then go unreported), and again once it is
 * back. Counted from the server's start, so a restart gives it time first.
 */
const SILENT_AFTER_MS = 10 * 60 * 1000

// One for the server: the health route hears the watcher, instrumentation runs the clock.
const state = serverState("watchdog", () => ({ lastSeen: Date.now(), silent: false, started: false }))

export function sawWatcher() {
  state.lastSeen = Date.now()
  if (state.silent) {
    state.silent = false
    notifyOps("👀 Bot canh gác đã liên lạc lại.", { silent: true })
  }
}

export function startWatchdog() {
  if (state.started) return
  state.started = true
  setInterval(() => {
    if (!opsEnabled() || state.silent || Date.now() - state.lastSeen < SILENT_AFTER_MS) return
    state.silent = true
    notifyOps(
      "👀 <b>Bot canh gác im lặng hơn 10 phút</b>\nMáy ubuntu có thể đã tắt hoặc mất mạng. Timi vẫn chạy, nhưng nếu Timi sập lúc này sẽ không có tin báo từ bot (UptimeRobot vẫn canh).",
    )
  }, 60 * 1000).unref?.()
}
