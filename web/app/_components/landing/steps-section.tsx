"use client"

import { useRef } from "react"
import { ChartLineIcon, LogInIcon, PencilLineIcon } from "lucide-react"
import { motion, useScroll, useSpring } from "motion/react"

import { Badge } from "@/components/ui/badge"

import { Reveal } from "./motion-primitives"

const STEPS = [
  {
    icon: LogInIcon,
    title: "Đăng nhập",
    description: "Dùng tài khoản Google, không cần tạo mật khẩu mới.",
  },
  {
    icon: PencilLineIcon,
    title: "Ghi lại",
    description: "Thêm tài khoản, giao dịch và các khoản vay nợ chỉ trong vài chạm.",
  },
  {
    icon: ChartLineIcon,
    title: "Theo dõi",
    description: "Xem dòng tiền, cơ cấu chi tiêu và tài sản ròng thay đổi theo thời gian.",
  },
] as const

export function StepsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 55%"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })

  return (
    <section
      id="cach-hoat-dong"
      aria-labelledby="steps-title"
      className="border-y bg-muted/40 pt-8 pb-12 sm:pt-12 sm:pb-16"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">3 bước đơn giản</Badge>
          <h2 id="steps-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Bắt đầu trong chưa đầy một phút
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground sm:text-lg">
            Không cần nhập liệu phức tạp. Thêm tài khoản đầu tiên, ghi giao
            dịch, và bức tranh tài chính tự hiện ra.
          </p>
        </Reveal>

        <div ref={ref} className="relative mt-16">
          <div
            className="absolute top-8 bottom-8 left-8 w-1 -translate-x-1/2 rounded-full bg-border md:top-8 md:right-[16.66%] md:bottom-auto md:left-[16.66%] md:h-1 md:w-auto md:translate-x-0 md:-translate-y-1/2"
            aria-hidden="true"
          >
            <motion.div
              className="size-full origin-top rounded-full bg-primary md:hidden"
              style={{ scaleY: progress }}
            />
            <motion.div
              className="hidden size-full origin-left rounded-full bg-primary md:block"
              style={{ scaleX: progress }}
            />
          </div>

          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon

            return (
              <li key={step.title} className="relative">
                <Reveal
                  delay={index * 0.12}
                  className="flex gap-5 md:flex-col md:items-center md:text-center"
                >
                  <motion.span
                    className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
                    initial={{ scale: 0.6, rotate: -12 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ type: "spring", stiffness: 260, damping: 14, delay: index * 0.12 }}
                  >
                    <Icon className="size-7" aria-hidden="true" />
                    <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border bg-background text-xs font-semibold text-foreground">
                      {index + 1}
                    </span>
                  </motion.span>
                  <div className="pt-1 md:pt-0">
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="mt-2 max-w-xs leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              </li>
            )
          })}
          </ol>
        </div>
      </div>
    </section>
  )
}
