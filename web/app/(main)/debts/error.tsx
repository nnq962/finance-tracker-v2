"use client"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"

export default function DebtsError({ retry }: { retry: () => void }) {
  return (
    <Page>
      <div className="space-y-4" role="alert">
        <h2 className="text-base font-medium">Không thể tải dữ liệu vay nợ</h2>
        <p className="text-sm text-muted-foreground">Vui lòng kiểm tra kết nối và thử lại. Dữ liệu đã lưu vẫn được giữ nguyên.</p>
        <Button onClick={() => retry()}>Thử lại</Button>
      </div>
    </Page>
  )
}
