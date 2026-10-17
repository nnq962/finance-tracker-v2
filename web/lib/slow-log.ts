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
}
