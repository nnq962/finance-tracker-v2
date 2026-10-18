import type { Instrumentation } from "next"

import { sentryDsn, sentryOptions } from "@/lib/sentry/options"

/** Error tracking on the server (lib/sentry/options.ts): on only with a DSN. */
export async function register() {
  if (!sentryDsn || process.env.NEXT_RUNTIME !== "nodejs") return
  const Sentry = await import("@sentry/nextjs")
  Sentry.init({
    ...sentryOptions,
    // Errors only: following every incoming and outgoing request (for
    // tracing, which is off) added listeners to each response, and Node
    // warned of a possible leak once Sentry was on (2026-10-18).
    integrations: (defaults) => defaults.filter((integration) => !["Http", "NodeFetch"].includes(integration.name)),
  })
}

/**
 * Errors Next caught while serving a page, a route or a Server Action: to
 * the admin's Telegram (batched, lib/ops/errors.ts) and to Sentry.
 */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const [error, request, context] = args
  const { reportServerError } = await import("@/lib/ops/errors")
  // The path without its query (a month, a search).
  reportServerError(error, `${request.method} ${request.path.split("?")[0]} · ${context.routeType}`)
  if (!sentryDsn) return
  const Sentry = await import("@sentry/nextjs")
  Sentry.captureRequestError(...args)
}
