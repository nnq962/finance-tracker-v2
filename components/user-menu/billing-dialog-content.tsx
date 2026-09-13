import { SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type BillingDialogContentProps = {
  onShowPlans: () => void
}

export function BillingDialogContent({
  onShowPlans,
}: BillingDialogContentProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gói đang sử dụng</CardTitle>
          <CardDescription>
            Thông tin gói dịch vụ và chu kỳ thanh toán hiện tại.
          </CardDescription>
          <CardAction>
            <Badge>Free</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Chi phí</p>
            <p className="text-sm font-medium">0đ</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Trạng thái</p>
            <Badge variant="secondary">Đang hoạt động</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Gia hạn tiếp theo</p>
            <p className="text-sm font-medium">Không áp dụng</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="button" variant="outline" onClick={onShowPlans}>
            <SparklesIcon />
            Xem các gói nâng cấp
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thanh toán</CardTitle>
          <CardDescription>
            Các khoản thanh toán và hoá đơn của tài khoản.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bạn chưa có giao dịch thanh toán nào.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
