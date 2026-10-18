"use client"

import { ErrorCard } from "@/components/app/status-screen"
import { Page } from "@/components/page"
import { useReportError } from "@/lib/sentry/report"

/** Any page of the app without an error screen of its own (settings, the catalogue). */
export default function MainError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error)
  return (
    <Page>
      <ErrorCard title="Không tải được trang này" onRetry={retry} />
    </Page>
  )
}
