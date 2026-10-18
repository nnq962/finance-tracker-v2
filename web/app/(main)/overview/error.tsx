"use client"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { useReportError } from "@/lib/sentry/report"

export default function OverviewError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error)
  return (
    <Page>
      <div className="space-y-4" role="alert">
        <h2 className="text-base font-medium">Không thể tải tổng quan tài chính</h2>
        <p className="text-sm text-muted-foreground">Vui lòng kiểm tra kết nối và thử lại.</p>
        <Button onClick={() => retry()}>Thử lại</Button>
      </div>
    </Page>
  )
}
