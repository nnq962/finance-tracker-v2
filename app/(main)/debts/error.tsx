"use client"

import { Button } from "@/components/ui/button"

export default function DebtsError({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4" role="alert">
      <h2 className="text-lg font-semibold">Không thể tải dữ liệu vay nợ</h2>
      <p className="text-sm text-muted-foreground">Vui lòng kiểm tra kết nối và thử lại. Dữ liệu đã lưu vẫn được giữ nguyên.</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  )
}
