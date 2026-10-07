"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CheckIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  ShieldCheckIcon,
  TicketPercentIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ChoiceTiles } from "@/components/app/choice-tiles"
import { NoticeBanner } from "@/components/app/notice-banner"
import { SettingsGroup } from "@/components/settings-list"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
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

type PlanScreenProps = {
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
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

const outcomeTones: Record<OutcomeTone, { icon: LucideIcon; tone: "income" | "warning" | "expense" }> = {
  success: { icon: CircleCheckIcon, tone: "income" },
  waiting: { icon: ClockIcon, tone: "warning" },
  problem: { icon: CircleAlertIcon, tone: "expense" },
}

/** What a year costs against twelve single months. */
const yearSaving = proPrices.month.amount * 12 - proPrices.year.amount
const yearSavingPercent = Math.round((yearSaving / (proPrices.month.amount * 12)) * 100)

const periodOptions = [
  { value: "month" as const, title: formatCurrency(proPrices.month.amount), description: "Trả theo tháng" },
  {
    value: "year" as const,
    title: formatCurrency(proPrices.year.amount),
    description: "Trả theo năm",
    badge: `Giảm ${yearSavingPercent}%`,
  },
]

const proFeatures = [
  `${plans.pro.aiMonthlyLimit} lượt trợ lý AI mỗi tháng, gấp ${Math.round(plans.pro.aiMonthlyLimit / plans.free.aiMonthlyLimit)} lần gói ${plans.free.label}`,
  "Dùng trước các tính năng AI mới",
  "Trả một lần, không tự động gia hạn",
]

const freeFeatures = [
  `${plans.free.aiMonthlyLimit} lượt trợ lý AI mỗi tháng`,
  "Không giới hạn giao dịch, tài khoản và vay nợ",
  "Nhắc ghi chép hằng ngày",
]

const faqs = [
  {
    id: "ai",
    question: "Trợ lý AI làm được gì?",
    answer:
      "Trợ lý AI ghi giao dịch từ câu bạn nhập hoặc nói, kể cả cách nói thông dụng. Các tính năng mới như chỉnh sửa giao dịch và hỏi đáp về chi tiêu sẽ ra mắt trước cho người dùng Pro.",
  },
  {
    id: "payment",
    question: "Thanh toán như thế nào?",
    answer:
      "Quét mã QR trên trang payOS bằng ứng dụng ngân hàng bất kỳ. Gói Pro được kích hoạt ngay khi giao dịch thành công.",
  },
  {
    id: "renewal",
    question: "Gói Pro có tự động gia hạn không?",
    answer: `Không. Mỗi lần thanh toán áp dụng cho thời hạn đã chọn; gia hạn sớm được cộng nối tiếp, không mất ngày còn lại. Khi hết hạn, tài khoản chuyển về gói ${plans.free.label}.`,
  },
  {
    id: "data",
    question: "Dữ liệu có bị ảnh hưởng khi hết Pro không?",
    answer: `Không. Toàn bộ dữ liệu được giữ nguyên, chỉ hạn mức trợ lý AI trở về mức của gói ${plans.free.label}.`,
  },
  {
    id: "quota",
    question: "Lượt AI được tính thế nào?",
    answer:
      "Mỗi yêu cầu gửi trợ lý AI tính là một lượt; yêu cầu không xử lý được sẽ không bị tính. Hạn mức được làm mới vào ngày 1 hằng tháng. Khi hết, hệ thống dùng lượt thưởng từ nhiệm vụ, loại lượt không có thời hạn.",
  },
]

/**
 * The plans, as on app pricing screens: a large title, Pro first with its
 * billing period picked from two tiles and what it adds to Free, then Free,
 * then the questions people ask. Buying goes through payOS.
 */
export function PlanScreen({ planState, checkoutEnabled, paymentOutcome }: PlanScreenProps) {
  const [period, setPeriod] = React.useState<PlanPeriod>("year")
  const [openFaq, setOpenFaq] = React.useState("")
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

  const note = !checkoutEnabled
    ? `Vui lòng liên hệ quản trị viên để ${isPro ? "gia hạn" : "nâng cấp"}`
    : isPro
      ? "Thời hạn mới được cộng nối tiếp, không mất ngày còn lại"
      : period === "year"
        ? `Chỉ ${formatCurrency(Math.round(proPrices.year.amount / 12))} mỗi tháng. Không tự động gia hạn`
        : "Kích hoạt ngay sau khi thanh toán. Không tự động gia hạn"

  // From the link under Pro's features: opens the answer and brings it into view, now and again
  // once it has opened below the question, so it is not left under the bottom edge.
  const showFaq = (id: string) => {
    setOpenFaq(id)
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    const item = document.getElementById(`plan-faq-${id}`)
    item?.scrollIntoView({ behavior, block: "center" })
    item?.addEventListener("animationend", () => item.scrollIntoView({ behavior, block: "nearest" }), { once: true })
  }

  return (
    <div className="space-y-6">
      {outcome ? (
        <NoticeBanner
          tone={outcomeTones[outcome.tone].tone}
          icon={outcomeTones[outcome.tone].icon}
          title={outcome.title}
          action={
            recordHref ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={recordHref}>Ghi khoản chi</Link>
              </Button>
            ) : null
          }
        >
          {outcome.description}
        </NoticeBanner>
      ) : null}

      <header className="flex flex-col items-center gap-2 pt-2 text-center">
        <h2 className="text-[28px] leading-tight font-semibold tracking-tight text-balance">
          {isPro ? `Bạn đang dùng ${plans.pro.label}` : "Nâng cấp Finance Tracker"}
        </h2>
        <p className="text-base text-muted-foreground">
          {isPro && planState.proEndsAt
            ? `Còn hạn đến ${formatDate(toDateKey(planState.proEndsAt))}`
            : "Chọn gói phù hợp với bạn"}
        </p>
      </header>

      <div className="space-y-4">
        <Card asChild size="lg">
          <section aria-labelledby="plan-pro">
            <CardHeader>
              <PlanName id="plan-pro" current={isPro}>
                {plans.pro.label}
              </PlanName>
              <CardDescription>Đầy đủ sức mạnh của trợ lý AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChoiceTiles
                tone="ai"
                aria-label="Kỳ thanh toán"
                options={periodOptions}
                value={period}
                onValueChange={setPeriod}
              />
              <div className="space-y-2.5">
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={!checkoutEnabled}
                  onClick={() => setConfirmOpen(true)}
                >
                  {isPro ? `Gia hạn thêm ${price.label}` : `Nâng cấp ${plans.pro.label}`}
                </Button>
                <p className="text-center text-xs text-muted-foreground">{note}</p>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-3 border-t">
              <p className="font-medium text-muted-foreground">Mọi thứ của gói {plans.free.label}, thêm:</p>
              <FeatureList features={proFeatures} />
              <button
                type="button"
                onClick={() => showFaq("quota")}
                className="relative mt-1 text-muted-foreground underline underline-offset-4 outline-none after:absolute after:-inset-x-2 after:-inset-y-3 focus-visible:text-foreground active:opacity-60"
              >
                Lượt AI được tính thế nào?
              </button>
            </CardFooter>
          </section>
        </Card>

        <Card asChild size="lg">
          <section aria-labelledby="plan-free">
            <CardHeader>
              <PlanName id="plan-free" current={!isPro}>
                {plans.free.label}
              </PlanName>
              <CardDescription>Các tính năng cơ bản, miễn phí</CardDescription>
            </CardHeader>
            <CardFooter className="border-t">
              <FeatureList features={freeFeatures} />
            </CardFooter>
          </section>
        </Card>
      </div>

      <p className="flex items-center justify-center gap-1.5 px-4 text-center text-xs text-muted-foreground">
        <ShieldCheckIcon className="size-4 shrink-0" aria-hidden="true" />
        Thanh toán bảo mật qua payOS, mọi ngân hàng
      </p>

      <Accordion type="single" collapsible value={openFaq} onValueChange={setOpenFaq}>
        <SettingsGroup title="Câu hỏi thường gặp" listClassName="px-4">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} asChild>
              <li id={`plan-faq-${faq.id}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </li>
            </AccordionItem>
          ))}
        </SettingsGroup>
      </Accordion>

      <CheckoutDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        period={period}
        renewing={isPro}
      />
    </div>
  )
}

/** A plan's name, with "Đang dùng" beside the one the user is on. */
function PlanName({ id, current, children }: { id: string; current: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <h3 id={id} className="text-xl font-semibold">
        {children}
      </h3>
      {current ? <Badge variant="income">Đang dùng</Badge> : null}
    </div>
  )
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3">
          <CheckIcon className="size-5 shrink-0 text-foreground/70" aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
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
