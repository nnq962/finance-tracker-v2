"use client"

import { CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { plans, proPrices, type PlanState } from "@/lib/plans/plans"

/** Where to send money for Pro, from the server's settings; none until it is set. */
export type PaymentInfo = {
  bankName: string
  accountNumber: string
  accountName: string
}

type PlanScreenProps = {
  planState: PlanState
  paymentInfo?: PaymentInfo
  /** What to write on the transfer, so the payment is matched to this user. */
  reference: string
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label}.`)
  } catch {
    toast.error("Không sao chép được, hãy chép tay nhé.")
  }
}

/** The user's plan, this month's AI requests, the plans side by side and how to pay for Pro. */
export function PlanScreen({ planState, paymentInfo, reference }: PlanScreenProps) {
  const isPro = planState.plan === "pro"
  const aiRemaining = Math.max(0, planState.aiLimit - planState.aiUsed)

  return (
    <div className="space-y-6">
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
          paymentInfo
            ? "Chuyển khoản đúng nội dung bên dưới. Pro được kích hoạt trong vòng 24 giờ sau khi nhận được tiền; gia hạn sớm sẽ cộng nối vào hạn hiện tại."
            : "Liên hệ quản trị viên để nâng cấp Pro."
        }
      >
        <SettingsRow title={`Pro ${proPrices.month.label}`} value={formatCurrency(proPrices.month.amount)} />
        <SettingsRow
          title={`Pro ${proPrices.year.label}`}
          description={`Chỉ ${formatCurrency(Math.round(proPrices.year.amount / 12))} mỗi tháng`}
          value={formatCurrency(proPrices.year.amount)}
        />
        {paymentInfo ? (
          <>
            <SettingsRow title="Ngân hàng" value={paymentInfo.bankName} />
            <SettingsRow
              title="Số tài khoản"
              value={paymentInfo.accountNumber}
              action={<CopyIcon className="size-4 text-muted-foreground" aria-hidden="true" />}
              chevron={false}
              onClick={() => copy(paymentInfo.accountNumber, "số tài khoản")}
            />
            <SettingsRow title="Chủ tài khoản" value={paymentInfo.accountName} />
            <SettingsRow
              title="Nội dung chuyển khoản"
              value={reference}
              action={<CopyIcon className="size-4 text-muted-foreground" aria-hidden="true" />}
              chevron={false}
              onClick={() => copy(reference, "nội dung chuyển khoản")}
            />
          </>
        ) : null}
      </SettingsGroup>
    </div>
  )
}
