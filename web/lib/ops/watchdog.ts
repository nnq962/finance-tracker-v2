import "server-only"

import { notifyOps, opsEnabled } from "./telegram"

/*
 * Who watches the watcher (2026-10-18): the watcher on the ubuntu machine
 * (deploy/watcher) asks /api/health every minute as "timi-watcher". When it
 * has not for 10 minutes, Timi says so on Telegram (the machine may be off or
 * offline, and Timi's outages would then go unreported), and again once it is
 * back. Counted from the server's start, so a restart gives it time first.
 */
const SILENT_AFTER_MS = 10 * 60 * 1000

let lastSeen = Date.now()
let silent = false
let started = false

export function sawWatcher() {
  lastSeen = Date.now()
  if (silent) {
    silent = false
    notifyOps("👀 Bot canh gác đã liên lạc lại.", { silent: true })
  }
}

export function startWatchdog() {
  if (started) return
  started = true
  setInterval(() => {
    if (!opsEnabled() || silent || Date.now() - lastSeen < SILENT_AFTER_MS) return
    silent = true
    notifyOps(
      "👀 <b>Bot canh gác im lặng hơn 10 phút</b>\nMáy ubuntu có thể đã tắt hoặc mất mạng. Timi vẫn chạy, nhưng nếu Timi sập lúc này sẽ không có tin báo từ bot (UptimeRobot vẫn canh).",
    )
  }, 60 * 1000).unref?.()
}
