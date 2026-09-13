"use client"

import { RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AccountsError({ reset }: { reset: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Không thể tải tài khoản</CardTitle>
        <CardDescription>
          Đã có lỗi khi kết nối dữ liệu. Vui lòng thử lại.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>
          <RotateCcwIcon />
          Thử lại
        </Button>
      </CardContent>
    </Card>
  )
}
