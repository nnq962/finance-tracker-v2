"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketPercentIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { SettingsGroup } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
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
  success: { icon: CircleCheckIcon, className: "text-income" },
  waiting: { icon: ClockIcon, className: "text-warning" },
  problem: { icon: CircleAlertIcon, className: "text-expense" },
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
  const isPro = planState.plan === "pro"
  const outcome = paymentOutcome ? outcomeMessages[paymentOutcome] : undefined
  // Paid through payOS: the order the user came back with writes the payment down as an expense.
  const order = useSearchParams().get("order")
  const recordHref =
    order && (paymentOutcome === "granted" || paymentOutcome === "settled")
      ? `/transactions?order=${encodeURIComponent(order)}`
      : undefined
  const price = proPrices[period]
  // The order is confirmed, with a coupon if any, in a dialog before payOS.
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  return (
    <div className={cn("space-y-6 pt-2", page && "md:space-y-10")}>
      {outcome ? (
        <div className={cn(page && "mx-auto max-w-xl")}>
          <OutcomeCard {...outcome} recordHref={recordHref} />
        </div>
      ) : null}

      <header className={cn("flex flex-col items-center gap-3 px-3 pt-2 text-center", page && "mx-auto max-w-2xl")}>
        <SparklesIcon className="size-8 text-ai" aria-hidden="true" />
        <div className="space-y-1.5">
          <h2 className="text-xl font-medium">
            {isPro ? "Bạn đang dùng Pro" : `Finance Tracker ${plans.pro.label}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            Trợ lý AI thông minh, tài chính trong tầm tay.
          </p>
        </div>
      </header>

      <section aria-labelledby="plan-options" className={cn("space-y-3", page && "md:space-y-5")}>
        <h2 id="plan-options" className="sr-only">
          Chọn gói
        </h2>
        <Tabs
          value={period}
          onValueChange={(value) => {
            if (value === "month" || value === "year") setPeriod(value)
          }}
          className={cn(page && "md:mx-auto md:w-full md:max-w-xs")}
        >
          <TabsList className="w-full" aria-label="Kỳ thanh toán">
            <TabsTrigger value="month">Theo tháng</TabsTrigger>
            <TabsTrigger value="year">
              Theo năm
              <Badge variant="secondary">-{yearSavingPercent}%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pro first on a phone; side by side from md up in the dialog, free on the left. There the
            cards share rows (subgrid), so headers, prices and footers line up and the buttons align. */}
        <div
          className={cn(
            "grid gap-3",
            page && "md:mx-auto md:max-w-4xl md:grid-cols-2 md:grid-rows-[auto_1fr_auto] md:gap-x-6 md:gap-y-0",
          )}
        >
          <Card className={cn(page && "md:row-span-3 md:grid md:grid-rows-subgrid")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plans.pro.label}
                <Badge variant="secondary">{isPro ? "Đang dùng" : "Khuyên dùng"}</Badge>
              </CardTitle>
              <CardDescription>Đầy đủ sức mạnh của trợ lý AI</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div>
                <PriceTag amount={price.amount} unit={period === "year" ? "năm" : "tháng"} />
                <p className="mt-1 text-sm text-muted-foreground">
                  {period === "year"
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
                size="lg"
                className="w-full"
                disabled={!checkoutEnabled}
                onClick={() => setConfirmOpen(true)}
              >
                {isPro ? `Gia hạn thêm ${price.label}` : `Nâng cấp Pro · ${formatCurrency(price.amount)}`}
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

        <p className="flex items-center justify-center gap-1.5 px-3 text-center text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4 shrink-0" aria-hidden="true" />
          Thanh toán bảo mật qua payOS, hỗ trợ mọi ngân hàng
        </p>
      </section>

      <div className={cn("space-y-6", page && "mx-auto max-w-3xl md:space-y-10")}>
        <SettingsGroup title="Câu hỏi thường gặp">
          {faqs.map((faq, index) => (
            <FaqRow key={faq.question} {...faq} first={index === 0} />
          ))}
        </SettingsGroup>
      </div>

      <CheckoutDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        period={period}
        renewing={isPro}
      />
    </div>
  )
}

function OutcomeCard({
  tone,
  title,
  description,
  recordHref,
}: {
  tone: OutcomeTone
  title: string
  description?: string
  /** Where the payment is written down as an expense. */
  recordHref?: string
}) {
  const { icon: Icon, className } = outcomeTones[tone]
  return (
    <Card size="sm" role="status">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={cn("size-4 shrink-0", className)} aria-hidden="true" />
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {recordHref ? (
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href={recordHref}>
              <ReceiptTextIcon />
              Ghi khoản chi
            </Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

function PriceTag({ amount, unit }: { amount: number; unit: string }) {
  return (
    <p className="flex items-baseline gap-1">
      <span className="text-[28px] leading-tight font-medium tracking-tight tabular-nums">
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
          <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Có</span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

function FaqRow({ question, answer, first }: { question: string; answer: string; first: boolean }) {
  return (
    <li>
      {first ? null : <Separator />}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Item asChild>
            <button type="button" className="group/faq text-left">
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
        <CollapsibleContent className="px-4 pb-3.5 text-sm text-muted-foreground">
          {answer}
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

/**
 * The order before payOS, as a checkout page has it: the plan and its
 * price, a field for a coupon code (checked by the server, which prices the
 * checkout again), the discount and what is paid.
 */
function CheckoutDialog({
  open,
  onOpenChange,
  period,
  renewing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  period: PlanPeriod
  renewing: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [code, setCode] = React.useState("")
  const [coupon, setCoupon] = React.useState<{ code: string; percentOff: number } | null>(null)
  const [codeError, setCodeError] = React.useState<string | null>(null)
  const [checking, setChecking] = React.useState(false)
  const [paying, setPaying] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const price = proPrices[period]
  const priced = coupon ? priceWithCoupon(period, coupon.percentOff) : null
  const total = priced?.amount ?? price.amount
  // A code that leaves (next to) nothing to pay grants Pro without payOS.
  const free = total < MIN_CHECKOUT_AMOUNT

  const changeOpen = (next: boolean) => {
    if (paying) return
    if (!next) {
      setCode("")
      setCoupon(null)
      setCodeError(null)
      setError(null)
    }
    onOpenChange(next)
  }

  const apply = async () => {
    if (!code.trim()) {
      setCodeError("Nhập mã giảm giá.")
      return
    }
    setChecking(true)
    const result = await checkCouponAction(code)
    setChecking(false)
    if (!result.success) {
      setCodeError(result.error)
      return
    }
    setCoupon({ code: result.code, percentOff: result.percentOff })
    setCode("")
  }

  const pay = async () => {
    setPaying(true)
    setError(null)
    const result = await startProCheckoutAction(period, pathname, coupon?.code)
    if (!result.success) {
      setPaying(false)
      setError(result.error)
      return
    }
    if ("granted" in result) {
      setPaying(false)
      toast.success("Đã nâng cấp Pro", { description: `Mã ${coupon?.code} đã được áp dụng.` })
      changeOpen(false)
      router.refresh()
      return
    }
    // payOS's page shows the QR and opens the bank app, then sends the user back here.
    window.location.assign(result.checkoutUrl)
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-sm"
        // No keyboard popping up for a code most people do not have.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Xác nhận thanh toán</DialogTitle>
        </DialogHeader>

        {coupon ? (
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">
              <TicketPercentIcon data-icon="inline-start" aria-hidden="true" />
              {coupon.code} · −{coupon.percentOff}%
            </Badge>
            <Button type="button" variant="ghost" size="xs" disabled={paying} onClick={() => setCoupon(null)}>
              Bỏ mã
            </Button>
          </div>
        ) : (
          <Field data-invalid={Boolean(codeError) || undefined}>
            <FieldLabel htmlFor="checkout-coupon">Mã giảm giá</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="checkout-coupon"
                value={code}
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={20}
                aria-invalid={Boolean(codeError) || undefined}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\s+/g, "").toUpperCase())
                  setCodeError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    void apply()
                  }
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton disabled={checking || paying} onClick={() => void apply()}>
                  {checking ? <Spinner /> : null}
                  Áp dụng
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {codeError ? <FieldError>{codeError}</FieldError> : null}
          </Field>
        )}

        {/* The order, as a receipt. */}
        <Card size="sm">
          <CardContent className="space-y-3">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">
                  {renewing ? "Gia hạn" : "Gói"} {plans.pro.label} · {price.label}
                </dt>
                <dd className="tabular-nums">{formatCurrency(price.amount)}</dd>
              </div>
              {priced ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Giảm giá ({coupon?.percentOff}%)</dt>
                  <dd className="tabular-nums text-income">
                    −{formatCurrency(priced.discount)}
                  </dd>
                </div>
              ) : null}
            </dl>
            <Separator />
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">Tổng thanh toán</span>
              <span className="text-base font-medium tabular-nums">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex-col sm:flex-col">
          {error ? <FieldError role="alert">{error}</FieldError> : null}
          <Button type="button" size="lg" className="w-full" disabled={paying || checking} onClick={() => void pay()}>
            {paying ? <Spinner /> : null}
            {free ? "Nhận Pro miễn phí" : `Thanh toán ${formatCurrency(total)}`}
          </Button>
          {free ? null : (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-4 shrink-0" aria-hidden="true" />
              Thanh toán bảo mật qua payOS
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
