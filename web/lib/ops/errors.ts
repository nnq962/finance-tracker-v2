import "server-only"

import { escapeHtml, notifyOps, opsEnabled } from "./telegram"

/*
 * Server errors to the admin's Telegram, without flooding it: the first
 * error is sent at once, then the ones after it are counted for 5 minutes
 * and sent as one line. Sentry keeps the details; this says that something
 * is wrong. Today's count goes into the evening summary.
 */
const WINDOW_MS = 5 * 60 * 1000

let windowEnds = 0
let pending = 0
let latest = ""
let dayKey = ""
let today = 0

function vietnamDay() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
}

/** Server errors counted today (Vietnam time), since the server started. */
export function serverErrorsToday() {
  return dayKey === vietnamDay() ? today : 0
}

export function reportServerError(error: unknown, where: string) {
  const day = vietnamDay()
  if (day !== dayKey) {
    dayKey = day
    today = 0
  }
  today += 1
  if (!opsEnabled()) return

  const message = error instanceof Error ? error.message : String(error)
  const line = `${escapeHtml(message.slice(0, 300))}\n<code>${escapeHtml(where)}</code>`
  const now = Date.now()
  if (now >= windowEnds) {
    windowEnds = now + WINDOW_MS
    pending = 0
    notifyOps(`⚠️ <b>Lỗi trên server</b>\n${line}`)
    setTimeout(() => {
      if (pending > 0) notifyOps(`⚠️ Thêm <b>${pending}</b> lỗi trong 5 phút qua. Mới nhất:\n${latest}`)
      pending = 0
    }, WINDOW_MS).unref?.()
    return
  }
  pending += 1
  latest = line
}
