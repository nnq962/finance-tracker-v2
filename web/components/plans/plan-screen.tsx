"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketPercentIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup, pressableRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Field, FieldError } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { checkCouponAction, startProCheckoutAction } from "@/lib/plans/actions"
import {
  MIN_CHECKOUT_AMOUNT,
  plans,
  priceWithCoupon,
  proPrices,
  type PlanPeriod,
  type PlanState,
} from "@/lib/plans/plans"
import type { PaymentOutcome } from "@/lib/plans/payos"
import { cn } from "@/lib/utils"

type PlanScreenProps = {
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
  /** In the settings sheet (one column), or as the full pricing in a dialog, which spreads out from md up. */
  layout?: "sheet" | "page"
}

type OutcomeTone = "success" | "waiting" | "problem"

const outcomeMessages: Partial<Record<PaymentOutcome, { tone: OutcomeTone; title: string; description?: string }>> = {
  granted: { tone: "success", title: "Đã nâng cấp Pro", description: "Cảm ơn bạn đã tin dùng Finance Tracker." },
  settled: { tone: "success", title: "Đã nâng cấp Pro", description: "Cảm ơn bạn đã tin dùng Finance Tracker." },
  pending: {
    tone: "waiting",
    title: "Đang chờ xác nhận thanh toán",
    description: "Gói Pro sẽ được kích hoạt ngay khi nhận được thanh toán.",
  },
  underpaid: {
    tone: "problem",
    title: "Số tiền nhận được chưa đủ",
    description: "Quản trị viên sẽ kiểm tra và liên hệ với bạn.",
  },
  cancelled: { tone: "problem", title: "Thanh toán đã bị huỷ" },
  expired: { tone: "problem", title: "Phiên thanh toán đã hết hạn", description: "Vui lòng thử lại." },
}

const outcomeTones: Record<OutcomeTone, { icon: LucideIcon; className: string }> = {
  success: { icon: CircleCheckIcon, className: "bg-[#dbf9d2] text-[#3e9727] dark:bg-[#203e1a] dark:text-[#94e379]" },
  waiting: { icon: ClockIcon, className: "bg-[#fff0c5] text-[#a45e00] dark:bg-[#3d3014] dark:text-[#ffd060]" },
  problem: { icon: CircleAlertIcon, className: "bg-[#ffe5e1] text-[#c8393a] dark:bg-[#4a2121] dark:text-[#ff9b93]" },
}

/** What a year costs against twelve single months. */
const yearSaving = proPrices.month.amount * 12 - proPrices.year.amount
const yearSavingPercent = Math.round((yearSaving / (proPrices.month.amount * 12)) * 100)

const faqs = [
  {
    question: "Trợ lý AI làm được gì?",
    answer:
      "Trợ lý AI ghi giao dịch từ câu bạn nhập hoặc nói, kể cả cách nói thông dụng. Các tính năng mới như chỉnh sửa giao dịch và hỏi đáp về chi tiêu sẽ ra mắt trước cho người dùng Pro.",
  },
  {
    question: "Thanh toán như thế nào?",
    answer:
      "Quét mã QR trên trang payOS bằng ứng dụng ngân hàng bất kỳ. Gói Pro được kích hoạt ngay khi giao dịch thành công.",
  },
  {
    question: "Gói Pro có tự động gia hạn không?",
    answer: `Không. Mỗi lần thanh toán áp dụng cho thời hạn đã chọn; gia hạn sớm được cộng nối tiếp, không mất ngày còn lại. Khi hết hạn, tài khoản chuyển về gói ${plans.free.label}.`,
  },
  {
    question: "Dữ liệu có bị ảnh hưởng khi hết Pro không?",
    answer: `Không. Toàn bộ dữ liệu được giữ nguyên, chỉ hạn mức trợ lý AI trở về mức của gói ${plans.free.label}.`,
  },
  {
    question: "Lượt AI được tính thế nào?",
    answer:
      "Mỗi yêu cầu gửi trợ lý AI tính là một lượt; yêu cầu không xử lý được sẽ không bị tính. Hạn mức được làm mới vào ngày 1 hằng tháng. Khi hết, hệ thống dùng lượt thưởng từ nhiệm vụ, loại lượt không có thời hạn.",
  },
]

/** The user's plan and this month's AI requests, the plans side by side and buying Pro through payOS. */
export function PlanScreen({ planState, checkoutEnabled, paymentOutcome, layout = "sheet" }: PlanScreenProps) {
  const page = layout === "page"
  const [period, setPeriod] = React.useState<PlanPeriod>("month")
  const [opening, setOpening] = React.useState(false)
  const [, startTransition] = React.useTransition()
  const pathname = usePathname()
  const router = useRouter()
  const isPro = planState.plan === "pro"
  const outcome = paymentOutcome ? outcomeMessages[paymentOutcome] : undefined
  const price = proPrices[period]
  // A code checked by the server; the price at checkout is worked out there again.
  const [coupon, setCoupon] = React.useState<{ code: string; percentOff: number } | null>(null)
  const discounted = coupon ? priceWithCoupon(period, coupon.percentOff) : null
  const payAmount = discounted?.amount ?? price.amount
  // A code that leaves (next to) nothing to pay grants Pro without payOS.
  const free = payAmount < MIN_CHECKOUT_AMOUNT

  const checkout = () => {
    setOpening(true)
    startTransition(async () => {
      const result = await startProCheckoutAction(period, pathname, coupon?.code)
      if (!result.success) {
        toast.error(result.error)
        setOpening(false)
        return
      }
      if ("granted" in result) {
        toast.success("Đã nâng cấp Pro", { description: `Mã ${coupon?.code} đã được áp dụng.` })
        setCoupon(null)
        setOpening(false)
        router.refresh()
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
            {isPro ? "Bạn đang dùng Pro" : `Finance Tracker ${plans.pro.label}`}
          </h2>
          <p className={cn("text-sm leading-relaxed text-muted-foreground", page && "md:text-base")}>
            Trợ lý AI thông minh, tài chính trong tầm tay.
          </p>
        </div>
      </header>

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

        {/* Pro first on a phone; side by side from md up in the dialog, free on the left. There the
            cards share rows (subgrid), so headers, prices and footers line up and the buttons align. */}
        <div
          className={cn(
            "grid gap-3",
            page && "md:mx-auto md:max-w-4xl md:grid-cols-2 md:grid-rows-[auto_1fr_auto] md:gap-x-6 md:gap-y-0",
          )}
        >
          {/* The recommended plan stands out with a grape outline, the colour the kit keeps for premium. */}
          <Card
            className={cn(
              "border-[#a376e9] ring-[#a376e9] dark:border-[#a376e9] dark:ring-[#a376e9]",
              page && "md:row-span-3 md:grid md:grid-rows-subgrid",
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plans.pro.label}
                <Badge variant="grape">{isPro ? "Đang dùng" : "Khuyên dùng"}</Badge>
              </CardTitle>
              <CardDescription>Đầy đủ sức mạnh của trợ lý AI</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div>
                <PriceTag
                  amount={payAmount}
                  listAmount={discounted ? price.amount : undefined}
                  unit={period === "year" ? "năm" : "tháng"}
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  {coupon
                    ? `Mã ${coupon.code} · Giảm ${coupon.percentOff}%`
                    : period === "year"
                      ? `Tương đương ${formatCurrency(Math.round(price.amount / 12))}/tháng · Tiết kiệm ${formatCurrency(yearSaving)}`
                      : `Tiết kiệm ${yearSavingPercent}% khi thanh toán theo năm`}
                </p>
              </div>
              <FeatureList
                features={[
                  `${plans.pro.aiMonthlyLimit} lượt trợ lý AI mỗi tháng`,
                  "Truy cập sớm tính năng AI mới",
                  `Bao gồm toàn bộ gói ${plans.free.label}`,
                  "Không tự động gia hạn",
                ]}
              />
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                type="button"
                variant="grape"
                size="lg"
                className="w-full"
                disabled={(!checkoutEnabled && !free) || opening}
                onClick={checkout}
              >
                {opening ? <LoaderCircleIcon className="animate-spin" aria-hidden="true" /> : null}
                {free
                  ? `Nhận Pro ${price.label} miễn phí`
                  : isPro
                    ? `Gia hạn thêm ${price.label} · ${formatCurrency(payAmount)}`
                    : `Nâng cấp Pro · ${formatCurrency(payAmount)}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {checkoutEnabled
                  ? isPro && planState.proEndsAt
                    ? `Còn hạn đến ${formatDate(toDateKey(planState.proEndsAt))}, thời hạn mới được cộng thêm`
                    : "Kích hoạt ngay sau khi thanh toán"
                  : "Vui lòng liên hệ quản trị viên để nâng cấp"}
              </p>
            </CardFooter>
          </Card>

          <Card className={cn(page && "md:order-first md:row-span-3 md:grid md:grid-rows-subgrid")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plans.free.label}
                {isPro ? null : <Badge variant="outline">Đang dùng</Badge>}
              </CardTitle>
              <CardDescription>Các tính năng cơ bản</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <PriceTag amount={0} unit="tháng" />
              <FeatureList
                features={[
                  `${plans.free.aiMonthlyLimit} lượt trợ lý AI mỗi tháng`,
                  "Không giới hạn giao dịch, tài khoản, ngân sách và vay nợ",
                  "Nhắc ghi chép hằng ngày",
                ]}
              />
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="button" variant="outline" size="lg" className="w-full" disabled>
                {isPro ? "Gói cơ bản" : "Gói hiện tại"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <CouponEntry coupon={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />

        <p className="flex items-center justify-center gap-1.5 px-3 text-center text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4 shrink-0" aria-hidden="true" />
          Thanh toán bảo mật qua payOS, hỗ trợ mọi ngân hàng
        </p>
      </section>

      <div className={cn("space-y-6", page && "mx-auto max-w-3xl md:space-y-10")}>
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

function PriceTag({ amount, listAmount, unit }: { amount: number; listAmount?: number; unit: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-1">
      <span className="font-heading text-4xl leading-none font-extrabold tracking-tight tabular-nums">
        {formatCurrency(amount)}
      </span>
      {/* The price before a coupon, struck through. */}
      {listAmount !== undefined ? (
        <s className="text-sm text-muted-foreground tabular-nums">
          <span className="sr-only">Giá gốc </span>
          {formatCurrency(listAmount)}
        </s>
      ) : null}
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

/** "Có mã giảm giá?" opening a field for the code, checked with the server, then the code applied. */
function CouponEntry({
  coupon,
  onApply,
  onRemove,
}: {
  coupon: { code: string; percentOff: number } | null
  onApply: (coupon: { code: string; percentOff: number }) => void
  onRemove: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [checking, setChecking] = React.useState(false)

  if (coupon) {
    return (
      <div className="flex items-center justify-center gap-2">
        <Badge variant="grape">
          <TicketPercentIcon data-icon="inline-start" aria-hidden="true" />
          {coupon.code} · −{coupon.percentOff}%
        </Badge>
        <Button type="button" variant="ghost" size="xs" onClick={onRemove}>
          Bỏ mã
        </Button>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="flex justify-center">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <TicketPercentIcon />
          Có mã giảm giá?
        </Button>
      </div>
    )
  }

  const apply = async () => {
    if (!code.trim()) {
      setError("Nhập mã giảm giá.")
      return
    }
    setChecking(true)
    const result = await checkCouponAction(code)
    setChecking(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    onApply({ code: result.code, percentOff: result.percentOff })
    setOpen(false)
    setCode("")
  }

  return (
    <Field data-invalid={Boolean(error) || undefined} className="mx-auto max-w-xs">
      <InputGroup>
        <InputGroupInput
          aria-label="Mã giảm giá"
          placeholder="Nhập mã"
          value={code}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={20}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              void apply()
            }
          }}
          autoFocus
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton disabled={checking} onClick={() => void apply()}>
            {checking ? <LoaderCircleIcon className="animate-spin" aria-hidden="true" /> : null}
            Áp dụng
          </InputGroupButton>
          <InputGroupButton
            size="icon-xs"
            aria-label="Đóng"
            onClick={() => {
              setOpen(false)
              setCode("")
              setError(null)
            }}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
