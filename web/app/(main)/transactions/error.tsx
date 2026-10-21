"use client"

import { ErrorCard } from "@/components/app/status-screen"
import { Page, PageHeader } from "@/components/page"
import { useReportError } from "@/lib/sentry/report"

export default function TransactionsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error)
  return (
    <Page>
      <PageHeader title="Giao dịch" bare />
      <ErrorCard title="Không tải được giao dịch" onRetry={retry} />
    </Page>
  )
}
