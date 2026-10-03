"use client"

import * as React from "react"
import { LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { startProCheckoutAction } from "@/lib/plans/actions"
import { plans, proPrices, type PlanPeriod, type PlanState } from "@/lib/plans/plans"
import type { PaymentOutcome } from "@/lib/plans/payos"

type PlanScreenProps = {
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
}

const outcomeMessages: Partial<Record<PaymentOutcome, string>> = {
  granted: "Thanh toán thành công. Cảm ơn bạn đã nâng cấp Pro!",
  settled: "Thanh toán thành công. Cảm ơn bạn đã nâng cấp Pro!",
  pending: "Đang chờ xác nhận thanh toán. Pro sẽ được kích hoạt ngay khi nhận được tiền.",
  underpaid: "Số tiền nhận được chưa đủ. Quản trị viên sẽ kiểm tra và liên hệ với bạn.",
  cancelled: "Bạn đã huỷ thanh toán.",
  expired: "Phiên thanh toán đã hết hạn. Hãy thử lại nhé.",
}

/** The user's plan, this month's AI requests, the plans side by side and buying Pro through payOS. */
export function PlanScreen({ planState, checkoutEnabled, paymentOutcome }: PlanScreenProps) {
  const [opening, setOpening] = React.useState<PlanPeriod | null>(null)
  const [, startTransition] = React.useTransition()
  const isPro = planState.plan === "pro"
  const aiRemaining = Math.max(0, planState.aiLimit - planState.aiUsed)
  const outcome = paymentOutcome ? outcomeMessages[paymentOutcome] : undefined

  const checkout = (period: PlanPeriod) => {
    setOpening(period)
    startTransition(async () => {
      const result = await startProCheckoutAction(period)
      if (!result.success) {
        toast.error(result.error)
        setOpening(null)
        return
      }
      // payOS's page shows the QR and opens the bank app, then sends the user back here.
      window.location.assign(result.checkoutUrl)
    })
  }

  return (
    <div className="space-y-6">
      {outcome ? (
        <SettingsGroup>
          <SettingsRow title={outcome} />
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="Gói hiện tại">
        <SettingsRow
          title="Gói"
          value={<Badge variant={isPro ? "grape" : "outline"}>{plans[planState.plan].label}</Badge>}
        />
        {planState.proEndsAt ? (
          <SettingsRow title="Hạn dùng" value={`Đến ${formatDate(toDateKey(planState.proEndsAt))}`} />
        ) : null}
        <SettingsRow
          title="Lượt AI tháng này"
          value={`${planState.aiUsed}/${planState.aiLimit}`}
          description={`Còn ${aiRemaining} lượt, làm mới vào ngày 1 hằng tháng`}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Các gói"
        footer="Ghi chép giao dịch, tài khoản, ngân sách và vay nợ không giới hạn ở cả hai gói."
      >
        <SettingsRow
          title="Miễn phí"
          description={`Trợ lý AI ${plans.free.aiMonthlyLimit} lượt mỗi tháng`}
          value="0 ₫"
        />
        <SettingsRow
          title="Pro"
          description={`Trợ lý AI ${plans.pro.aiMonthlyLimit} lượt mỗi tháng`}
          value={`${formatCurrency(proPrices.month.amount)}/tháng`}
        />
      </SettingsGroup>

      <SettingsGroup
        title={isPro ? "Gia hạn Pro" : "Nâng cấp Pro"}
        footer={
          checkoutEnabled
            ? "Thanh toán bằng QR chuyển khoản qua payOS. Pro được kích hoạt ngay khi nhận được tiền; gia hạn sớm sẽ cộng nối vào hạn hiện tại."
            : "Liên hệ quản trị viên để nâng cấp Pro."
        }
      >
        {(["month", "year"] as const).map((period) => (
          <SettingsRow
            key={period}
            title={`Pro ${proPrices[period].label}`}
            description={
              period === "year" ? `Chỉ ${formatCurrency(Math.round(proPrices.year.amount / 12))} mỗi tháng` : undefined
            }
            value={formatCurrency(proPrices[period].amount)}
            action={opening === period ? <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" aria-hidden="true" /> : undefined}
            disabled={opening !== null}
            onClick={checkoutEnabled ? () => checkout(period) : undefined}
          />
        ))}
      </SettingsGroup>
    </div>
  )
}
