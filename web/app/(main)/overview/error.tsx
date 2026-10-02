"use client"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"

export default function OverviewError({ retry }: { retry: () => void }) {
  return (
    <Page>
      <div className="space-y-4" role="alert">
        <h2 className="text-lg font-semibold">Không thể tải tổng quan tài chính</h2>
        <p className="text-sm text-muted-foreground">Vui lòng kiểm tra kết nối và thử lại.</p>
        <Button onClick={() => retry()}>Thử lại</Button>
      </div>
    </Page>
  )
}
