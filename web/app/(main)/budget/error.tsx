"use client"

import { RotateCcwIcon } from "lucide-react"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AccountsError({ retry }: { retry: () => void }) {
  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle>Không thể tải ngân sách</CardTitle>
          <CardDescription>
            Đã có lỗi khi kết nối dữ liệu. Vui lòng thử lại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => retry()}>
            <RotateCcwIcon />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    </Page>
  )
}
