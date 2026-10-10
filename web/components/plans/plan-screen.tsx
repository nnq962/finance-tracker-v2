"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  CheckIcon,
  CircleAlertIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketPercentIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Chip } from "@/components/app/chip"
import { ChoiceTiles } from "@/components/app/choice-tiles"
import { IconTile } from "@/components/app/icon-tile"
import { NoticeBanner } from "@/components/app/notice-banner"
import { InlineInput } from "@/components/forms/inline-input"
import { SettingsFieldRow, SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { FieldError } from "@/components/ui/field"
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

type OutcomeTone = "waiting" | "problem"

// Only what stays true after it is read: money that may have left the bank
// without Pro yet. Paid, cancelled and expired are a toast (PlanOverlay).
const outcomeMessages: Partial<Record<PaymentOutcome, { tone: OutcomeTone; title: string; description?: string }>> = {
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
}

const outcomeTones: Record<OutcomeTone, { icon: LucideIcon; tone: "warning" | "expense" }> = {
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
  const isPro = planState.plan === "pro"
  const outcome = paymentOutcome ? outcomeMessages[paymentOutcome] : undefined
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

  return (
    <div className="space-y-6">
      {outcome ? (
        <NoticeBanner
          tone={outcomeTones[outcome.tone].tone}
          icon={outcomeTones[outcome.tone].icon}
          title={outcome.title}
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

      <Accordion type="single" collapsible>
        <SettingsGroup title="Câu hỏi thường gặp" listClassName="px-4">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} asChild>
              <li>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </li>
            </AccordionItem>
          ))}
        </SettingsGroup>
      </Accordion>

      <CheckoutSheet
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
 * The order before payOS, as a bottom sheet over the plans: Pro's tile and
 * what it brings, then the receipt as rows (the plan and its price; a coupon
 * code typed in place, checked by the server, which prices the checkout
 * again, and once taken a chip of the code to remove it and the discount on
 * its own row), the total apart, and paying at the foot. A code that leaves
 * nothing to pay grants Pro at once, without payOS.
 */
function CheckoutSheet({
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
    <Drawer open={open} onOpenChange={changeOpen}>
      <DrawerContent
        surface="grouped"
        // No keyboard popping up for a code most people do not have.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <div className="flex flex-col items-center gap-1 text-center">
            <IconTile icon={SparklesIcon} tone="ai" size="lg" />
            <DrawerTitle className="mt-2 text-lg">{renewing ? `Gia hạn ${plans.pro.label}` : `Nâng cấp ${plans.pro.label}`}</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              {plans.pro.aiMonthlyLimit} lượt AI mỗi tháng
            </DrawerDescription>
          </div>

          <div className="flex flex-col gap-2">
            <SettingsGroup>
              <SettingsRow
                title={`Gói ${plans.pro.label} · ${price.label}`}
                action={<span className="text-sm tabular-nums">{formatCurrency(price.amount)}</span>}
              />
              {coupon ? (
                <>
                  <SettingsRow
                    title="Mã giảm giá"
                    action={
                      <Chip
                        tone="income"
                        media={<TicketPercentIcon className="ml-2.5 size-4 shrink-0" aria-hidden="true" />}
                        onRemove={paying ? undefined : () => setCoupon(null)}
                        removeLabel="Bỏ mã"
                      >
                        {coupon.code}
                      </Chip>
                    }
                  />
                  <SettingsRow
                    title={`Giảm ${coupon.percentOff}%`}
                    action={
                      <span className="text-sm text-income tabular-nums">−{formatCurrency(priced?.discount ?? 0)}</span>
                    }
                  />
                </>
              ) : (
                <SettingsFieldRow htmlFor="checkout-coupon" title="Mã giảm giá" invalid={Boolean(codeError)}>
                  <InlineInput
                    id="checkout-coupon"
                    value={code}
                    placeholder="Nhập mã"
                    autoCapitalize="characters"
                    maxLength={20}
                    enterKeyHint="done"
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-mr-2 ml-1"
                    disabled={!code.trim() || checking || paying}
                    onClick={() => void apply()}
                  >
                    {checking ? <Spinner /> : null}
                    Áp dụng
                  </Button>
                </SettingsFieldRow>
              )}
            </SettingsGroup>
            {codeError ? <FieldError className="px-4">{codeError}</FieldError> : null}
          </div>

          <SettingsGroup>
            <SettingsRow
              title={<span className="font-semibold">Tổng thanh toán</span>}
              action={<span className="text-base font-semibold tabular-nums">{formatCurrency(total)}</span>}
            />
          </SettingsGroup>

          <div className="flex flex-col gap-2">
            {error ? <FieldError role="alert" className="text-center">{error}</FieldError> : null}
            <Button type="button" className="w-full" disabled={paying || checking} onClick={() => void pay()}>
              {paying ? <Spinner /> : null}
              {free ? "Nhận Pro miễn phí" : `Thanh toán ${formatCurrency(total)}`}
            </Button>
            {free ? null : (
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheckIcon className="size-4 shrink-0" aria-hidden="true" />
                Bảo mật qua payOS · quét QR, mọi ngân hàng
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
