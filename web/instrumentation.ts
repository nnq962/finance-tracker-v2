import type { Instrumentation } from "next"

import { sentryDsn, sentryOptions } from "@/lib/sentry/options"

/** Error tracking on the server (lib/sentry/options.ts): on only with a DSN. */
export async function register() {
  if (!sentryDsn || process.env.NEXT_RUNTIME !== "nodejs") return
  const Sentry = await import("@sentry/nextjs")
  Sentry.init(sentryOptions)
}

/** Errors Next caught while serving a page, a route or a Server Action. */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!sentryDsn || process.env.NEXT_RUNTIME !== "nodejs") return
  const Sentry = await import("@sentry/nextjs")
  Sentry.captureRequestError(...args)
}
