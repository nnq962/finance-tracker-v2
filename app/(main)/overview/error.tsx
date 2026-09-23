"use client"

import { Button } from "@/components/ui/button"

export default function OverviewError({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4" role="alert">
      <h2 className="text-lg font-semibold">Không thể tải tổng quan tài chính</h2>
      <p className="text-sm text-muted-foreground">Vui lòng kiểm tra kết nối và thử lại.</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  )
}
