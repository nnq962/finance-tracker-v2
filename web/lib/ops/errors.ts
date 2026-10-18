import "server-only"

import { serverState } from "@/lib/server-state"

import { escapeHtml, notifyOps, opsEnabled } from "./telegram"

/*
 * Server errors to the admin's Telegram, without flooding it: the first
 * error is sent at once, then the ones after it are counted for 5 minutes
 * and sent as one line. Sentry keeps the details; this says that something
 * is wrong. Today's count goes into the evening summary.
 */
const WINDOW_MS = 5 * 60 * 1000

// One for the server: errors are counted in instrumentation, read by the summary's route.
const state = serverState("server-errors", () => ({ windowEnds: 0, pending: 0, latest: "", dayKey: "", today: 0 }))

function vietnamDay() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
}

/** Server errors counted today (Vietnam time), since the server started. */
export function serverErrorsToday() {
  return state.dayKey === vietnamDay() ? state.today : 0
}

export function reportServerError(error: unknown, where: string) {
  const day = vietnamDay()
  if (day !== state.dayKey) {
    state.dayKey = day
    state.today = 0
  }
  state.today += 1
  if (!opsEnabled()) return

  const message = error instanceof Error ? error.message : String(error)
  const line = `${escapeHtml(message.slice(0, 300))}\n<code>${escapeHtml(where)}</code>`
  const now = Date.now()
  if (now >= state.windowEnds) {
    state.windowEnds = now + WINDOW_MS
    state.pending = 0
    notifyOps(`⚠️ <b>Lỗi trên server</b>\n${line}`)
    setTimeout(() => {
      if (state.pending > 0) notifyOps(`⚠️ Thêm <b>${state.pending}</b> lỗi trong 5 phút qua. Mới nhất:\n${state.latest}`)
      state.pending = 0
    }, WINDOW_MS).unref?.()
    return
  }
  state.pending += 1
  state.latest = line
}
