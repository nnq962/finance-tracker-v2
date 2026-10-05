"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import {
  ArrowLeftRightIcon,
  BanknoteIcon,
  BarChart3Icon,
  BellRingIcon,
  HandCoinsIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  SparklesIcon,
  WalletCardsIcon,
} from "lucide-react"
import { AnimatePresence, motion, useInView } from "motion/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import { CountUp, EASE_OUT, Reveal } from "./motion-primitives"

export function FeaturesSection() {
  return (
    <section
      id="tinh-nang"
      aria-labelledby="features-title"
      className="pt-8 pb-20 sm:pt-12 sm:pb-28"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">
            <SparklesIcon />
            Một nơi để theo dõi
          </Badge>
          <h2 id="features-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Từ từng giao dịch đến bức tranh tài chính tổng thể
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground sm:text-lg">
            Các phần trong Finance Tracker liên kết với nhau, nên số dư và
            tổng quan luôn khớp với những gì bạn đã ghi lại.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-6">
          <FeatureCard
            className="md:col-span-2 lg:col-span-4"
            icon={BarChart3Icon}
            title="Tổng quan tài chính"
            description="Tài sản ròng, dòng tiền theo kỳ và cơ cấu chi tiêu theo hạng mục, gói gọn trên một màn hình."
            layout="wide"
          >
            <SpendingDonut />
          </FeatureCard>

          <FeatureCard
            className="lg:col-span-2"
            delay={0.08}
            icon={WalletCardsIcon}
            title="Tài khoản & ví"
            description="Tiền mặt, ngân hàng, ví điện tử — mỗi nơi một số dư, tự cập nhật theo giao dịch."
          >
            <AccountStack />
          </FeatureCard>

          <FeatureCard
            className="lg:col-span-2"
            icon={ReceiptTextIcon}
            title="Ghi chép thu chi"
            description="Khoản chi, khoản thu, chuyển tiền giữa tài khoản kèm hạng mục và ghi chú."
          >
            <TransactionKinds />
          </FeatureCard>

          <FeatureCard
            className="lg:col-span-2"
            delay={0.08}
            icon={HandCoinsIcon}
            title="Theo dõi vay nợ"
            description="Cho vay, đi vay, lịch sử trả nợ và tiền lãi tính theo ngày — biết rõ còn bao nhiêu."
          >
            <DebtProgress />
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2 lg:col-span-2"
            delay={0.16}
            icon={BellRingIcon}
            title="Nhắc nhở mỗi ngày"
            description="Chọn giờ nhắc, nhận thông báo đẩy trên điện thoại và máy tính để không bỏ sót."
          >
            <ReminderStack />
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  className,
  delay = 0,
  icon: Icon,
  title,
  description,
  layout = "stack",
  children,
}: {
  className?: string
  delay?: number
  icon: typeof BarChart3Icon
  title: string
  description: string
  layout?: "stack" | "wide"
  children: ReactNode
}) {
  return (
    <Reveal delay={delay} className={className}>
      <Card className="h-full gap-6">
        <div
          className={cn(
            "flex h-full flex-col gap-6",
            layout === "wide" && "sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-center",
          )}
        >
          <CardHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="leading-6">{description}</CardDescription>
          </CardHeader>
          <CardContent className={layout === "stack" ? "mt-auto" : undefined} aria-hidden="true">
            {children}
          </CardContent>
        </div>
      </Card>
    </Reveal>
  )
}

const SPENDING = [
  { label: "Ăn uống", value: 38, strokeClassName: "stroke-expense", dotClassName: "bg-expense" },
  { label: "Nhà cửa", value: 27, strokeClassName: "stroke-expense/75", dotClassName: "bg-expense/75" },
  { label: "Đi lại", value: 15, strokeClassName: "stroke-expense/55", dotClassName: "bg-expense/55" },
  { label: "Mua sắm", value: 12, strokeClassName: "stroke-expense/40", dotClassName: "bg-expense/40" },
  { label: "Khác", value: 8, strokeClassName: "stroke-expense/25", dotClassName: "bg-expense/25" },
] as const

const SPENDING_SEGMENTS = SPENDING.map((segment, index) => ({
  ...segment,
  start: SPENDING.slice(0, index).reduce((sum, item) => sum + item.value, 0),
}))

function SpendingDonut() {
  const radius = 15.915

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl bg-muted p-5 min-[420px]:flex-row">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 42 42" className="size-full -rotate-90">
          <circle cx="21" cy="21" r={radius} fill="none" strokeWidth="6" className="stroke-border" />
          {SPENDING_SEGMENTS.map((segment, index) => {
            return (
              <motion.circle
                key={segment.label}
                cx="21"
                cy="21"
                r={radius}
                fill="none"
                className={segment.strokeClassName}
                strokeWidth="6"
                strokeDashoffset={-segment.start}
                initial={{ strokeDasharray: `0 100` }}
                whileInView={{ strokeDasharray: `${segment.value - 1} ${101 - segment.value}` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.12, ease: EASE_OUT }}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Đã chi</span>
          <CountUp value={9_850_000} className="text-sm tabular-nums" />
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2.5 text-sm min-[420px]:grid-cols-1">
        {SPENDING.map((segment, index) => (
          <motion.li
            key={segment.label}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.08, ease: EASE_OUT }}
          >
            <span className={cn("size-2.5 shrink-0 rounded-full", segment.dotClassName)} />
            <span className="flex-1 truncate text-muted-foreground">{segment.label}</span>
            <span className="tabular-nums">{segment.value}%</span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

const ACCOUNTS = [
  { name: "Vietcombank", logo: "/institutions/banks/vietcombank.svg", balance: 42_500_000 },
  { name: "Ví MoMo", logo: "/institutions/wallets/momo.svg", balance: 1_280_000 },
  { name: "Tiền mặt", logo: null, balance: 3_150_000 },
] as const

function AccountStack() {
  return (
    <ul className="space-y-2">
      {ACCOUNTS.map((account, index) => (
        <motion.li
          key={account.name}
          className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 + index * 0.1, ease: EASE_OUT }}
        >
          {account.logo ? (
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-white">
              <Image src={account.logo} alt="" width={28} height={28} className="size-7 object-contain" />
            </span>
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BanknoteIcon className="size-4" />
            </span>
          )}
          <span className="flex-1 truncate font-semibold">{account.name}</span>
          <CountUp value={account.balance} delay={0.2 + index * 0.1} className="tabular-nums" />
        </motion.li>
      ))}
    </ul>
  )
}

const KINDS = [
  {
    id: "expense",
    label: "Chi",
    title: "Mua sắm cuối tuần",
    meta: "Mua sắm · Ví MoMo",
    amount: -420_000,
    icon: ShoppingBagIcon,
    activeClassName: "bg-expense/10 text-expense",
    amountClassName: "text-expense",
  },
  {
    id: "income",
    label: "Thu",
    title: "Thưởng dự án",
    meta: "Thu nhập · Vietcombank",
    amount: 5_000_000,
    icon: SparklesIcon,
    activeClassName: "bg-income/10 text-income",
    amountClassName: "text-income",
  },
  {
    id: "transfer",
    label: "Chuyển",
    title: "Nạp tiền vào ví",
    meta: "Vietcombank → MoMo",
    amount: 1_000_000,
    icon: ArrowLeftRightIcon,
    activeClassName: "bg-transfer/10 text-transfer",
    amountClassName: "text-foreground",
  },
] as const

function TransactionKinds() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: "-60px" })
  const [activeIndex, setActiveIndex] = useState(0)
  const active = KINDS[activeIndex]
  const Icon = active.icon

  useEffect(() => {
    if (!inView) return
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % KINDS.length)
    }, 2400)

    return () => window.clearInterval(timer)
  }, [inView])

  return (
    <div ref={ref} className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {KINDS.map((kind, index) => (
          <span
            key={kind.id}
            className={cn(
              "relative flex h-8 items-center justify-center text-xs font-semibold transition-colors",
              index === activeIndex ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {index === activeIndex ? (
              <motion.span
                layoutId="landing-kind-highlight"
                className="absolute inset-0 rounded-lg bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            ) : null}
            <span className="relative">{kind.label}</span>
          </span>
        ))}
      </div>

      <div className="relative h-[4.25rem] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={active.id}
            className="flex items-center gap-3 rounded-xl border px-3 py-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", active.activeClassName)}>
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{active.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{active.meta}</span>
            </span>
            <span className={cn("shrink-0 tabular-nums", active.amountClassName)}>
              {formatCurrency(active.amount, {
                signDisplay: active.amount < 0 ? "auto" : "always",
              })}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

const DEBTS = [
  { name: "Minh Anh", initials: "MA", label: "Cho vay", paid: 0.72, remaining: 1_400_000, barClassName: "bg-income" },
  { name: "Quốc Huy", initials: "QH", label: "Đi vay", paid: 0.35, remaining: 6_500_000, barClassName: "bg-expense" },
] as const

function DebtProgress() {
  return (
    <ul className="space-y-4">
      {DEBTS.map((debt, index) => (
        <li key={debt.name} className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {debt.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{debt.name}</span>
              <span className="block text-xs text-muted-foreground">{debt.label}</span>
            </span>
            <span className="text-right">
              <span className="block text-xs text-muted-foreground">Còn lại</span>
              <span className="tabular-nums">{formatCurrency(debt.remaining)}</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn("h-full origin-left rounded-full", debt.barClassName)}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: debt.paid }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.2 + index * 0.15, ease: EASE_OUT }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

const REMINDERS = [
  { title: "Đến giờ ghi chép rồi!", body: "Hôm nay bạn đã chi tiêu những gì?", time: "21:00" },
  { title: "Đừng quên hôm nay nhé", body: "Ghi lại vài khoản để số dư luôn đúng.", time: "21:00" },
] as const

function ReminderStack() {
  return (
    <div className="relative space-y-2">
      {REMINDERS.map((reminder, index) => (
        <motion.div
          key={reminder.title}
          className="flex items-start gap-3 rounded-xl border bg-card px-3 py-2.5"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          whileInView={{ opacity: index > 0 ? 0.7 : 1, y: 0, scale: index > 0 ? 0.96 : 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 + index * 0.25, ease: [0.3, 1.5, 0.5, 1] }}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <motion.span
              className="flex"
              animate={index === 0 ? { rotate: [0, -16, 14, -10, 8, 0] } : undefined}
              transition={{ duration: 1, delay: 1.2, repeat: Infinity, repeatDelay: 3 }}
            >
              <BellRingIcon className="size-4" />
            </motion.span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{reminder.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{reminder.time}</span>
            </span>
            <span className="block truncate text-xs text-muted-foreground">{reminder.body}</span>
          </span>
        </motion.div>
      ))}
    </div>
  )
}
