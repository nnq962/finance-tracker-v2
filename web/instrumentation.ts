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

/** Errors Next caught while serving a page, a route or a Server Action. */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!sentryDsn || process.env.NEXT_RUNTIME !== "nodejs") return
  const Sentry = await import("@sentry/nextjs")
  Sentry.captureRequestError(...args)
}
