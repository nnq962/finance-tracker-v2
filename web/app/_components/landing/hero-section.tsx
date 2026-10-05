"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  BellRingIcon,
  MoonStarIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { motion, type Variants } from "motion/react"

import { PwaInstallButton } from "@/components/pwa-install-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { HeroPreview } from "./hero-preview"
import { EASE_OUT } from "./motion-primitives"

const HEADLINE_LEAD = ["Hiểu", "rõ", "dòng", "tiền,"]
const HEADLINE_ACCENT = ["làm", "chủ", "từng", "đồng."]

const TRUST_POINTS = [
  { icon: ShieldCheckIcon, label: "Đăng nhập bằng Google" },
  { icon: BellRingIcon, label: "Nhắc ghi chép mỗi ngày" },
  { icon: MoonStarIcon, label: "Giao diện sáng & tối" },
] as const

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
}

const word: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
}

export function HeroSection() {
  return (
    <section className="relative isolate">
      <HeroBackdrop />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 lg:pt-20 lg:pb-32">
        <motion.div
          className="flex flex-col items-start"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="default">
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-income opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-income" />
              </span>
              Ứng dụng web · Cài như app
            </Badge>
          </motion.div>

          <h1 className="mt-6 max-w-3xl text-[2.6rem] leading-[1.02] font-semibold tracking-tight min-[400px]:text-5xl sm:text-6xl lg:text-[3.75rem] xl:text-[4.25rem]">
            <span className="sr-only">
              {`${HEADLINE_LEAD.join(" ")} ${HEADLINE_ACCENT.join(" ")}`}
            </span>
            <span aria-hidden="true" className="block">
              {HEADLINE_LEAD.map((text) => (
                <motion.span key={text} variants={word} className="mr-[0.22em] inline-block">
                  {text}
                </motion.span>
              ))}
            </span>
            <span aria-hidden="true" className="block text-muted-foreground">
              <span className="relative inline-block">
                {HEADLINE_ACCENT.map((text, index) => (
                  <motion.span
                    key={text}
                    variants={word}
                    className={index < HEADLINE_ACCENT.length - 1 ? "mr-[0.22em] inline-block" : "inline-block"}
                  >
                    {text}
                  </motion.span>
                ))}
                <Squiggle />
              </span>
            </span>
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
          >
            Finance Tracker gom thu chi, số dư tài khoản, các khoản vay nợ và
            tài sản ròng về một nơi — để bạn luôn biết tiền đang đi đâu mà
            không cần bảng tính rối rắm.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/overview">
                Bắt đầu quản lý
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <a href="#tinh-nang">Xem tính năng</a>
            </Button>
            <PwaInstallButton />
          </motion.div>

          <motion.ul
            variants={fadeUp}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-4 text-foreground" aria-hidden="true" />
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <HeroPreview />
      </div>
    </section>
  )
}

function Squiggle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 18"
      preserveAspectRatio="none"
      className="absolute -bottom-2 left-0 h-3 w-full text-border sm:-bottom-3 sm:h-4"
    >
      <motion.path
        d="M3 12 C 40 3, 70 3, 100 10 S 165 17, 200 9 S 265 2, 297 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.95, ease: EASE_OUT }}
      />
    </svg>
  )
}

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1.2px,transparent_1.2px)] bg-[size:22px_22px] mask-radial-[70%_60%] mask-radial-at-[50%_35%] mask-radial-from-30% mask-radial-to-100%" />
      <motion.div
        className="absolute -top-24 -left-24 size-72 rounded-full bg-muted blur-3xl sm:size-[28rem]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-10 -right-24 size-80 rounded-full bg-muted blur-3xl sm:size-[32rem]"
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 size-64 rounded-full bg-muted blur-3xl sm:size-96"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
