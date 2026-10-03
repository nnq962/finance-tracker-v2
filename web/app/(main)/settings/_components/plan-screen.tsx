"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  LoaderCircleIcon,
  MinusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, pressableRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { startProCheckoutAction } from "@/lib/plans/actions"
import { plans, proPrices, type PlanPeriod, type PlanState } from "@/lib/plans/plans"
import type { PaymentOutcome } from "@/lib/plans/payos"
import { cn } from "@/lib/utils"

type PlanScreenProps = {
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
  /** In the settings sheet (one column), or as the full pricing page, which spreads out from md up. */
  layout?: "sheet" | "page"
}

type OutcomeTone = "success" | "waiting" | "problem"

const outcomeMessages: Partial<Record<PaymentOutcome, { tone: OutcomeTone; title: string; description?: string }>> = {
  granted: { tone: "success", title: "Đã nâng cấp Pro", description: "Cảm ơn bạn đã ủng hộ Finance Tracker!" },
  settled: { tone: "success", title: "Đã nâng cấp Pro", description: "Cảm ơn bạn đã ủng hộ Finance Tracker!" },
  pending: {
    tone: "waiting",
    title: "Đang chờ xác nhận thanh toán",
    description: "Pro sẽ được kích hoạt ngay khi nhận được tiền.",
  },
  underpaid: {
    tone: "problem",
    title: "Số tiền nhận được chưa đủ",
    description: "Quản trị viên sẽ kiểm tra và liên hệ với bạn.",
  },
  cancelled: { tone: "problem", title: "Bạn đã huỷ thanh toán" },
  expired: { tone: "problem", title: "Phiên thanh toán đã hết hạn", description: "Hãy thử lại nhé." },
}

const outcomeTones: Record<OutcomeTone, { icon: LucideIcon; className: string }> = {
  success: { icon: CircleCheckIcon, className: "bg-[#dbf9d2] text-[#3e9727] dark:bg-[#203e1a] dark:text-[#94e379]" },
  waiting: { icon: ClockIcon, className: "bg-[#fff0c5] text-[#a45e00] dark:bg-[#3d3014] dark:text-[#ffd060]" },
  problem: { icon: CircleAlertIcon, className: "bg-[#ffe5e1] text-[#c8393a] dark:bg-[#4a2121] dark:text-[#ff9b93]" },
}

/** What a year costs against twelve single months. */
const yearSaving = proPrices.month.amount * 12 - proPrices.year.amount
const yearSavingPercent = Math.round((yearSaving / (proPrices.month.amount * 12)) * 100)

/** Everything but the AI assistant is the same on both plans. */
const comparison: { feature: string; free: string | boolean; pro: string | boolean }[] = [
  { feature: "Trợ lý AI ghi giao dịch", free: `${plans.free.aiMonthlyLimit} lượt/tháng`, pro: `${plans.pro.aiMonthlyLimit} lượt/tháng` },
  { feature: "Dùng sớm tính năng AI mới", free: false, pro: true },
  { feature: "Ghi chép thu chi", free: true, pro: true },
  { feature: "Tài khoản & ví", free: true, pro: true },
  { feature: "Ngân sách", free: true, pro: true },
  { feature: "Vay nợ", free: true, pro: true },
  { feature: "Nhắc ghi chi tiêu", free: true, pro: true },
]

const faqs = [
  {
    question: "Thanh toán như thế nào?",
    answer:
      "Bạn quét mã QR chuyển khoản trên trang của payOS bằng ứng dụng ngân hàng bất kỳ. Pro được kích hoạt ngay khi tiền về, không cần chờ duyệt.",
  },
  {
    question: "Pro có tự động gia hạn không?",
    answer: `Không. Mỗi lần thanh toán dùng cho đúng thời hạn bạn chọn; hết hạn, tài khoản tự về gói ${plans.free.label}.`,
  },
  {
    question: "Gia hạn sớm có bị mất ngày còn lại không?",
    answer: "Không. Thời hạn mới được cộng nối vào sau hạn hiện tại.",
  },
  {
    question: "Hết Pro thì dữ liệu của tôi thế nào?",
    answer: `Giữ nguyên toàn bộ. Chỉ số lượt trợ lý AI mỗi tháng quay về mức của gói ${plans.free.label}.`,
  },
  {
    question: "Lượt AI được tính thế nào?",
    answer: "Mỗi lần nhờ trợ lý AI đọc một câu (gõ hoặc nói) tính là một lượt; lần AI không đọc được thì không bị tính. Lượt được làm mới vào ngày 1 hằng tháng; khi hết, lượt thưởng từ nhiệm vụ được dùng tiếp và không hết hạn.",
  },
]

/** The user's plan and this month's AI requests, the plans side by side and buying Pro through payOS. */
export function PlanScreen({ planState, checkoutEnabled, paymentOutcome, layout = "sheet" }: PlanScreenProps) {
  const page = layout === "page"
  const [period, setPeriod] = React.useState<PlanPeriod>("year")
  const [opening, setOpening] = React.useState(false)
  const [, startTransition] = React.useTransition()
  const isPro = planState.plan === "pro"
  const outcome = paymentOutcome ? outcomeMessages[paymentOutcome] : undefined
  const price = proPrices[period]

  const checkout = () => {
    setOpening(true)
    startTransition(async () => {
      const result = await startProCheckoutAction(period, layout)
      if (!result.success) {
        toast.error(result.error)
        setOpening(false)
        return
      }
      // payOS's page shows the QR and opens the bank app, then sends the user back here.
      window.location.assign(result.checkoutUrl)
    })
  }

  return (
    <div className={cn("space-y-6 pt-2", page && "md:space-y-10")}>
      {outcome ? (
        <div className={cn(page && "mx-auto max-w-xl")}>
          <OutcomeCard {...outcome} />
        </div>
      ) : null}

      <header className={cn("flex flex-col items-center gap-3 px-3 pt-2 text-center", page && "mx-auto max-w-2xl")}>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#f2e9ff] text-[#7a4aba] dark:bg-[#3b2c54] dark:text-[#d0b2ff]">
          <SparklesIcon className="size-7" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className={cn("font-heading text-2xl leading-tight font-extrabold", page && "md:text-4xl")}>
            {isPro ? "Bạn đang dùng Pro" : "Ghi chép nhanh hơn với Pro"}
          </h2>
          <p className={cn("text-sm leading-relaxed text-muted-foreground", page && "md:text-base")}>
            Gõ hoặc nói một câu như “trưa nay ăn phở 45 cành”, trợ lý AI điền sẵn số tiền, hạng mục và thời gian cho bạn.
          </p>
        </div>
      </header>

      <div className={cn(page && "mx-auto max-w-md")}>
        <UsageCard planState={planState} />
      </div>

      <section aria-labelledby="plan-options" className={cn("space-y-3", page && "md:space-y-5")}>
        <h2 id="plan-options" className="sr-only">
          Chọn gói
        </h2>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(value) => {
            if (value === "month" || value === "year") setPeriod(value)
          }}
          className={cn("grid w-full grid-cols-2", page && "md:mx-auto md:max-w-xs")}
          aria-label="Kỳ thanh toán"
        >
          <ToggleGroupItem value="month">Theo tháng</ToggleGroupItem>
          <ToggleGroupItem value="year">
            Theo năm
            <Badge variant="sun">-{yearSavingPercent}%</Badge>
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Pro first on a phone; side by side from md up on the page, free on the left. */}
        <div className={cn("grid gap-3", page && "md:mx-auto md:max-w-4xl md:grid-cols-2 md:gap-6")}>
          {/* The recommended plan stands out with a grape outline, the colour the kit keeps for premium. */}
          <Card className="border-[#a376e9] ring-[#a376e9] dark:border-[#a376e9] dark:ring-[#a376e9]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plans.pro.label}
                <Badge variant="grape">{isPro ? "Đang dùng" : "Khuyên dùng"}</Badge>
              </CardTitle>
              <CardDescription>Cho người ghi chép mỗi ngày</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div>
                <PriceTag amount={price.amount} unit={period === "year" ? "năm" : "tháng"} />
                <p className="mt-1 text-sm text-muted-foreground">
                  {period === "year"
                    ? `Chỉ ${formatCurrency(Math.round(price.amount / 12))}/tháng, tiết kiệm ${formatCurrency(yearSaving)}`
                    : `Hoặc ${formatCurrency(proPrices.year.amount)}/năm, tiết kiệm ${yearSavingPercent}%`}
                </p>
              </div>
              <FeatureList
                features={[
                  `${plans.pro.aiMonthlyLimit} lượt trợ lý AI mỗi tháng`,
                  "Dùng sớm các tính năng AI mới",
                  `Mọi tính năng của gói ${plans.free.label}`,
                  "Thanh toán một lần, không tự động gia hạn",
                ]}
              />
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                type="button"
                variant="grape"
                size="lg"
                className="w-full"
                disabled={!checkoutEnabled || opening}
                onClick={checkout}
              >
                {opening ? <LoaderCircleIcon className="animate-spin" aria-hidden="true" /> : null}
                {isPro ? `Gia hạn thêm ${price.label}` : `Nâng cấp Pro · ${formatCurrency(price.amount)}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {checkoutEnabled
                  ? isPro && planState.proEndsAt
                    ? `Pro hiện có hạn đến ${formatDate(toDateKey(planState.proEndsAt))}, thời hạn mới được cộng nối vào sau.`
                    : "Kích hoạt ngay khi thanh toán thành công."
                  : "Liên hệ quản trị viên để nâng cấp Pro."}
              </p>
            </CardFooter>
          </Card>

          <Card className={cn(page && "md:order-first")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plans.free.label}
                {isPro ? null : <Badge variant="outline">Đang dùng</Badge>}
              </CardTitle>
              <CardDescription>Đủ để bắt đầu quản lý chi tiêu</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <PriceTag amount={0} unit="mãi mãi" />
              <FeatureList
                features={[
                  `${plans.free.aiMonthlyLimit} lượt trợ lý AI mỗi tháng`,
                  "Giao dịch, tài khoản, ngân sách và vay nợ không giới hạn",
                  "Nhắc ghi chi tiêu hằng ngày",
                ]}
              />
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="button" variant="outline" size="lg" className="w-full" disabled>
                {isPro ? "Dùng lại khi Pro hết hạn" : "Gói hiện tại"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <p className="flex items-center justify-center gap-1.5 px-3 text-center text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4 shrink-0" aria-hidden="true" />
          Thanh toán an toàn qua payOS bằng QR mọi ngân hàng
        </p>
      </section>

      <div className={cn("space-y-6", page && "mx-auto max-w-3xl md:space-y-10")}>
        <ComparisonTable />

        <SettingsGroup title="Câu hỏi thường gặp">
          {faqs.map((faq) => (
            <FaqRow key={faq.question} {...faq} />
          ))}
        </SettingsGroup>
      </div>
    </div>
  )
}

function OutcomeCard({ tone, title, description }: { tone: OutcomeTone; title: string; description?: string }) {
  const { icon: Icon, className } = outcomeTones[tone]
  return (
    <Card size="sm" role="status">
      <CardContent className="flex items-start gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", className)}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="font-heading text-base leading-snug font-extrabold">{title}</p>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function UsageCard({ planState }: { planState: PlanState }) {
  const isPro = planState.plan === "pro"
  const used = Math.min(planState.aiUsed, planState.aiLimit)
  const percent = planState.aiLimit > 0 ? (used / planState.aiLimit) * 100 : 0
  const remaining = Math.max(0, planState.aiLimit - planState.aiUsed)

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Lượt AI tháng này</p>
            <p className="font-heading text-xl leading-tight font-extrabold tabular-nums">
              {planState.aiUsed}
              <span className="text-base text-muted-foreground">/{planState.aiLimit}</span>
            </p>
          </div>
          <Badge variant={isPro ? "grape" : "outline"}>{plans[planState.plan].label}</Badge>
        </div>
        <Progress value={percent} tone={percent >= 90 ? "coral" : isPro ? "grape" : "sky"} aria-label="Lượt AI đã dùng" />
        <p className="text-xs text-muted-foreground">
          Còn {remaining} lượt, làm mới vào ngày 1 hằng tháng
          {planState.aiCredits > 0 ? ` · ${planState.aiCredits} lượt thưởng` : ""}
          {planState.proEndsAt ? ` · Pro đến ${formatDate(toDateKey(planState.proEndsAt))}` : ""}
        </p>
      </CardContent>
    </Card>
  )
}

function PriceTag({ amount, unit }: { amount: number; unit: string }) {
  return (
    <p className="flex items-baseline gap-1">
      <span className="font-heading text-4xl leading-none font-extrabold tracking-tight tabular-nums">
        {formatCurrency(amount)}
      </span>
      <span className="text-sm text-muted-foreground">/{unit}</span>
    </p>
  )
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-2">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <CheckMark />
          <span className="leading-snug">{feature}</span>
        </li>
      ))}
    </ul>
  )
}

function CheckMark() {
  return (
    <span className="mt-px flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#dbf9d2] text-[#3e9727] dark:bg-[#203e1a] dark:text-[#94e379]">
      <CheckIcon className="size-3" strokeWidth={3} aria-hidden="true" />
      <span className="sr-only">Có</span>
    </span>
  )
}

function ComparisonTable() {
  return (
    <SettingsGroup
      title="So sánh các gói"
      header={
        <div className="grid grid-cols-[1fr_5.5rem_5.5rem] gap-2 px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <span>Tính năng</span>
          <span className="text-center">{plans.free.label}</span>
          <span className="text-center">{plans.pro.label}</span>
        </div>
      }
    >
      {comparison.map((row) => (
        <li
          key={row.feature}
          className={cn(
            "grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2 px-3 py-2.5 text-sm",
            settingsSeparatorClassName(false),
          )}
        >
          <span className="font-medium">{row.feature}</span>
          <ComparisonCell value={row.free} />
          <ComparisonCell value={row.pro} />
        </li>
      ))}
    </SettingsGroup>
  )
}

function ComparisonCell({ value }: { value: string | boolean }) {
  return (
    <span className="flex justify-center text-center text-xs font-medium text-muted-foreground">
      {value === true ? (
        <CheckMark />
      ) : value === false ? (
        <MinusIcon className="size-4" aria-label="Không có" />
      ) : (
        value
      )}
    </span>
  )
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  return (
    <li className={cn("py-1 not-first:pt-1.5", settingsSeparatorClassName(false))}>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Item asChild>
            <button type="button" className={cn("group/faq", pressableRow)}>
              <ItemContent>
                <ItemTitle>{question}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <ChevronDownIcon
                  className="size-4 text-muted-foreground transition-transform group-data-[state=open]/faq:rotate-180"
                  aria-hidden="true"
                />
              </ItemActions>
            </button>
          </Item>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-2.5 text-sm leading-relaxed text-muted-foreground">
          {answer}
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}
