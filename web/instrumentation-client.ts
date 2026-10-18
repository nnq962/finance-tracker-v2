import { sentryDsn, sentryOptions } from "@/lib/sentry/options"

/*
 * Error tracking in the browser (lib/sentry/options.ts). Sentry loads once
 * the page is up and the browser idle, so it adds nothing to a page's first
 * load; an error before then is kept and sent once it has loaded.
 */
if (sentryDsn) {
  const early: unknown[] = []
  const keep = (event: Event) => {
    early.push(event instanceof ErrorEvent ? (event.error ?? event.message) : (event as PromiseRejectionEvent).reason)
  }
  window.addEventListener("error", keep)
  window.addEventListener("unhandledrejection", keep)

  const start = () =>
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.init(sentryOptions)
      window.removeEventListener("error", keep)
      window.removeEventListener("unhandledrejection", keep)
      for (const error of early) Sentry.captureException(error)
      early.length = 0
    })

  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => void start(), { timeout: 5000 })
  else setTimeout(() => void start(), 3000)
}
