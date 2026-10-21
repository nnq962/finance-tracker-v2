"use client"

import { ErrorCard } from "@/components/app/status-screen"
import { Page, PageHeader } from "@/components/page"
import { useReportError } from "@/lib/sentry/report"

export default function DebtsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error)
  return (
    <Page>
      <PageHeader title="Vay nợ" bare />
      <ErrorCard title="Không tải được các khoản vay nợ" onRetry={retry} />
    </Page>
  )
}
