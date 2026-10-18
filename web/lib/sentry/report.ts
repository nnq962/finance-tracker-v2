"use client"

import * as React from "react"

import { sentryDsn } from "@/lib/sentry/options"

/**
 * Sends an error an error boundary caught to Sentry. Boundaries (error.tsx)
 * handle what they catch, so it never reaches the browser's error handler.
 */
export function useReportError(error: Error & { digest?: string }) {
  React.useEffect(() => {
    if (!sentryDsn) return
    void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error))
  }, [error])
}
