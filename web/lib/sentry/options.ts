import type { BrowserOptions, ErrorEvent, Breadcrumb } from "@sentry/nextjs"

/*
 * Error tracking with Sentry (2026-10-18). Off unless NEXT_PUBLIC_SENTRY_DSN
 * is set at build time (deploy/.env). Errors only: no performance tracing,
 * no session replay, so the free plan's quota goes to errors. Default PII
 * stays off (Sentry's own default), and beyond it nothing about
 * the user leaves the app: no cookies, headers or request bodies, no query
 * strings (a month, a search), no user, and no click or input trail, whose
 * labels can carry a transaction's name or amount.
 */
export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || undefined

function withoutQuery(url: string | undefined) {
  if (!url) return url
  const cut = url.search(/[?#]/)
  return cut === -1 ? url : url.slice(0, cut)
}

function scrubEvent(event: ErrorEvent): ErrorEvent | null {
  if (event.request) {
    event.request = { url: withoutQuery(event.request.url), method: event.request.method }
  }
  delete event.user
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb).filter((crumb): crumb is Breadcrumb => crumb !== null)
  }
  return event
}

function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  if (crumb.category === "ui.click" || crumb.category === "ui.input" || crumb.category === "console") return null
  if (crumb.data) {
    for (const key of ["url", "from", "to"] as const) {
      if (typeof crumb.data[key] === "string") crumb.data[key] = withoutQuery(crumb.data[key])
    }
  }
  return crumb
}

export const sentryOptions = {
  dsn: sentryDsn,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
  // A page from before a deploy calling the new server; the app already offers a reload.
  ignoreErrors: [/Failed to find Server Action/, /older or newer deployment/, "ResizeObserver loop"],
  // Errors from browser extensions, not the app.
  denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-(web-)?extension:\/\//],
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
} satisfies BrowserOptions
