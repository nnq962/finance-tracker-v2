import "server-only"

/*
 * How long serving really takes on the home server (2026-10-17): a step
 * slower than SLOW_LOG_MS (300 by default, 0 logs every one) writes one line,
 * "[slow] <what> <ms>ms", to the server's log. Never user data: what is named
 * is a page, a check, or a query's SQL, whose values travel apart from it.
 * Read on the server with: docker compose logs web | grep '\[slow\]'
 */
const configured = Number(process.env.SLOW_LOG_MS)
const SLOW_MS = process.env.SLOW_LOG_MS && Number.isFinite(configured) ? configured : 300

/** Logs `what` when `ms` reaches the threshold; `detail` (more timings) follows in brackets. */
export function logIfSlow(what: string, ms: number, detail?: string) {
  if (ms < SLOW_MS) return
  console.info(`[slow] ${what} ${Math.round(ms)}ms${detail ? ` (${detail})` : ""}`)
  if (ms >= VERY_SLOW_MS) noticeVerySlow(what, ms, detail)
}

/*
 * A page taking 3 s or more on the server also goes to the admin's Telegram,
 * at most once every 30 minutes (2026-10-18).
 */
const VERY_SLOW_MS = 3000
let quietUntil = 0

function noticeVerySlow(what: string, ms: number, detail?: string) {
  if (Date.now() < quietUntil) return
  quietUntil = Date.now() + 30 * 60 * 1000
  void import("@/lib/ops/telegram").then(({ escapeHtml, notifyOps }) =>
    notifyOps(`🐢 <b>Server chậm</b>: ${escapeHtml(what)} mất ${(ms / 1000).toFixed(1)} giây${detail ? ` (${escapeHtml(detail)})` : ""}`),
  )
}
