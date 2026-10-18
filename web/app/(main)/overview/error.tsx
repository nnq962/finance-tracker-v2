"use client"

import { ErrorCard } from "@/components/app/status-screen"
import { Page, PageHeader } from "@/components/page"
import { useReportError } from "@/lib/sentry/report"

export default function OverviewError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error)
  return (
    <Page>
      <PageHeader title="Tổng quan" />
      <ErrorCard title="Không tải được Tổng quan" onRetry={retry} />
    </Page>
  )
}
