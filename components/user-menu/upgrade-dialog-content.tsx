import { CheckIcon } from "lucide-react"

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

const plans = [
  {
    name: "Free",
    price: "0đ",
    period: "Miễn phí",
    description: "Các công cụ cơ bản để bắt đầu quản lý tài chính cá nhân.",
    features: [
      "Theo dõi tài khoản và số dư",
      "Ghi chép thu chi hằng ngày",
      "Xem tổng quan tài chính",
    ],
    action: "Gói hiện tại",
    disabled: true,
  },
  {
    name: "Pro",
    price: "79.000đ",
    period: "/ tháng",
    description: "Phân tích sâu hơn và sử dụng đầy đủ các tính năng nâng cao.",
    features: [
      "Toàn bộ tính năng của Free",
      "Báo cáo và biểu đồ nâng cao",
      "Không giới hạn tài khoản",
    ],
    action: "Chọn gói Pro",
    badge: "Phổ biến",
    disabled: false,
  },
  {
    name: "Lifetime",
    price: "1.490.000đ",
    period: "Thanh toán một lần",
    description: "Sở hữu trọn đời và nhận mọi cập nhật trong tương lai.",
    features: [
      "Toàn bộ tính năng của Pro",
      "Không cần gia hạn định kỳ",
      "Ưu tiên nhận tính năng mới",
    ],
    action: "Chọn gói Lifetime",
    disabled: false,
  },
] as const

export function UpgradeDialogContent() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.name}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            {"badge" in plan && (
              <CardAction>
                <Badge>{plan.badge}</Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {plan.price}
              </p>
              <p className="text-sm text-muted-foreground">{plan.period}</p>
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <CheckIcon className="mt-0.5 size-4 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button type="button" className="w-full" disabled={plan.disabled}>
              {plan.action}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
