"use client"

import { ErrorCard } from "@/components/app/status-screen"
import { Page, PageHeader } from "@/components/page"
import { useReportError } from "@/lib/sentry/report"

export default function AccountsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error)
  return (
    <Page>
      <PageHeader title="Tài khoản" />
      <ErrorCard title="Không tải được tài khoản" onRetry={retry} />
    </Page>
  )
}
