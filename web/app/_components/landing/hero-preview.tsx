"use client"

import type { PointerEvent, ReactNode } from "react"
import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  BellRingIcon,
  BriefcaseBusinessIcon,
  HandCoinsIcon,
  TrendingUpIcon,
  UtensilsIcon,
} from "lucide-react"
import { motion, useMotionValue, useSpring } from "motion/react"

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

import { CountUp, EASE_OUT } from "./motion-primitives"

const MONTHS = [
  { label: "T5", income: 62, expense: 48 },
  { label: "T6", income: 70, expense: 52 },
  { label: "T7", income: 58, expense: 61 },
  { label: "T8", income: 76, expense: 49 },
  { label: "T9", income: 82, expense: 55 },
  { label: "T10", income: 94, expense: 46 },
] as const

const RECENT = [
  {
    title: "Lương tháng 10",
    meta: "Vietcombank · 09:12",
    amount: 18_000_000,
    icon: BriefcaseBusinessIcon,
    iconClassName: "bg-income/10 text-income",
    amountClassName: "text-income",
  },
  {
    title: "Ăn trưa",
    meta: "Tiền mặt · 12:30",
    amount: -65_000,
    icon: UtensilsIcon,
    iconClassName: "bg-expense/10 text-expense",
    amountClassName: "text-expense",
  },
  {
    title: "Nạp ví MoMo",
    meta: "Chuyển khoản · 18:45",
    amount: 500_000,
    icon: ArrowLeftRightIcon,
    iconClassName: "bg-transfer/10 text-transfer",
    amountClassName: "text-foreground",
  },
] as const

const TILT = 8

export function HeroPreview() {
  const rotateX = useSpring(useMotionValue(0), { stiffness: 140, damping: 18 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 140, damping: 18 })

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(x * TILT * 2)
    rotateX.set(-y * TILT * 2)
  }

  function handlePointerLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.35, ease: EASE_OUT }}
      className="relative mx-auto w-full max-w-[34rem] lg:max-w-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 1400 }}
        className="relative"
      >
        <div
          className="absolute -inset-3 -z-10 rotate-3 rounded-[2rem] bg-muted sm:-inset-5"
          aria-hidden="true"
        />
        <div
          className="absolute -inset-3 -z-20 -rotate-2 rounded-[2rem] bg-border sm:-inset-5"
          aria-hidden="true"
        />

        <Card className="gap-5">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Tổng quan tài chính</CardTitle>
                <CardDescription>Dữ liệu minh hoạ</CardDescription>
              </div>
              <Badge variant="secondary">Tháng này</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <NetWorthTile />
            <CashFlowBars />
            <ul className="space-y-1">
              {RECENT.map((item, index) => {
                const Icon = item.icon

                return (
                  <motion.li
                    key={item.title}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.3 + index * 0.12, ease: EASE_OUT }}
                    className="flex items-center gap-3 rounded-xl px-1 py-2"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        item.iconClassName,
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    </span>
                    <span className={cn("shrink-0 tabular-nums", item.amountClassName)}>
                      {formatCurrency(item.amount, {
                        signDisplay: item.amount < 0 ? "auto" : "always",
                      })}
                    </span>
                  </motion.li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        <FloatingChip
          className="top-[52%] -left-4 sm:-left-10 lg:-left-14"
          delay={1.5}
          floatDuration={5}
        >
          <ChipIcon className="bg-income/10 text-income">
            <ArrowDownLeftIcon className="size-4" />
          </ChipIcon>
          <div>
            <p className="text-xs text-muted-foreground">Đã thu tuần này</p>
            <CountUp
              value={8_400_000}
              signDisplay="always"
              delay={1.6}
              className="text-income tabular-nums"
            />
          </div>
        </FloatingChip>

        <FloatingChip
          className="top-[52%] -right-3 sm:-right-8 lg:-right-10"
          delay={1.8}
          floatDuration={6}
        >
          <ChipIcon className="bg-muted text-foreground">
            <HandCoinsIcon className="size-4" />
          </ChipIcon>
          <div className="w-28">
            <p className="text-xs text-muted-foreground">Khoản vay đã trả</p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full origin-left rounded-full bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 0.62 }}
                transition={{ duration: 1.2, delay: 2.1, ease: EASE_OUT }}
              />
            </div>
          </div>
        </FloatingChip>

        <FloatingChip
          className="-bottom-12 left-6 sm:left-10"
          delay={2.1}
          floatDuration={5.5}
        >
          <ChipIcon className="bg-warning/15 text-warning">
            <motion.span
              className="flex"
              animate={{ rotate: [0, -16, 14, -10, 8, 0] }}
              transition={{ duration: 1, delay: 3, repeat: Infinity, repeatDelay: 3.5 }}
            >
              <BellRingIcon className="size-4" />
            </motion.span>
          </ChipIcon>
          <div>
            <p className="font-semibold">Đến giờ ghi chép</p>
            <p className="text-xs text-muted-foreground">Nhắc mỗi ngày lúc 21:00</p>
          </div>
        </FloatingChip>
      </motion.div>
    </motion.div>
  )
}

function NetWorthTile() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-muted p-5 sm:p-6">
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Tài sản ròng</p>
          <CountUp
            value={124_680_000}
            delay={0.6}
            duration={2}
            className="mt-2 block text-3xl font-bold tabular-nums sm:text-4xl"
          />
        </div>
        <Badge variant="default">
          <TrendingUpIcon aria-hidden="true" />
          12,4%
        </Badge>
      </div>
      <svg
        viewBox="0 0 300 60"
        preserveAspectRatio="none"
        className="relative mt-4 h-12 w-full text-income"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hero-spark-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0 48 C 30 44, 45 30, 75 34 S 120 46, 150 30 S 200 22, 225 24 S 270 8, 300 6 L 300 60 L 0 60 Z"
          fill="url(#hero-spark-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
        />
        <motion.path
          d="M0 48 C 30 44, 45 30, 75 34 S 120 46, 150 30 S 200 22, 225 24 S 270 8, 300 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 0.7, ease: EASE_OUT }}
        />
      </svg>
    </div>
  )
}

function CashFlowBars() {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Dòng tiền 6 tháng</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-income" aria-hidden="true" />
            Thu
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-expense" aria-hidden="true" />
            Chi
          </span>
        </span>
      </div>
      <div className="mt-3 flex h-24 items-end justify-between gap-2" aria-hidden="true">
        {MONTHS.map((month, index) => (
          <div key={month.label} className="flex h-full flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end justify-center gap-1">
              <motion.span
                className="w-full max-w-3 origin-bottom rounded-t-[4px] bg-income"
                style={{ height: `${month.income}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.8, delay: 0.9 + index * 0.08, ease: EASE_OUT }}
              />
              <motion.span
                className="w-full max-w-3 origin-bottom rounded-t-[4px] bg-expense"
                style={{ height: `${month.expense}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.8, delay: 0.95 + index * 0.08, ease: EASE_OUT }}
              />
            </div>
            <span className="text-[0.65rem] text-muted-foreground">{month.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FloatingChip({
  className,
  delay,
  floatDuration,
  children,
}: {
  className?: string
  delay: number
  floatDuration: number
  children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.3, 1.5, 0.5, 1] }}
      className={cn("absolute z-10 hidden sm:block", className)}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <Card size="sm" className="flex-row items-center gap-3 px-3">
          {children}
        </Card>
      </motion.div>
    </motion.div>
  )
}

function ChipIcon({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", className)}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}
