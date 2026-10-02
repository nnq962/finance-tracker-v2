"use client"

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { motion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Reveal } from "./motion-primitives"

const COINS = [
  { className: "top-[18%] left-[8%] size-10", delay: 0, duration: 6 },
  { className: "top-[62%] left-[14%] size-6", delay: 1.2, duration: 5 },
  { className: "top-[22%] right-[10%] size-8", delay: 0.6, duration: 5.5 },
  { className: "bottom-[16%] right-[18%] size-12", delay: 1.8, duration: 7 },
] as const

export function CtaSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28">
      <Reveal className="mx-auto w-full max-w-7xl rounded-[2rem] dark:ring-2 dark:ring-[#35323e]">
        <div className="relative isolate overflow-hidden rounded-[2rem] [clip-path:inset(0_round_2rem)] bg-[#2b2a33] px-6 py-16 text-center text-white sm:px-12 sm:py-24 dark:bg-[#201e26]">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.08)_1.2px,transparent_1.2px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_75%)]" />
            <motion.div
              className="absolute -top-32 -left-24 size-96 rounded-full bg-[#6ecc49]/25 blur-3xl"
              animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -right-24 -bottom-32 size-96 rounded-full bg-[#38b8f6]/25 blur-3xl"
              animate={{ x: [0, -70, 0], y: [0, -30, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            {COINS.map((coin) => (
              <motion.span
                key={coin.className}
                className={`absolute hidden rounded-full border-4 border-[#d98b09] bg-[#fdc436] sm:block ${coin.className}`}
                animate={{ y: [0, -14, 0], rotate: [0, 12, 0] }}
                transition={{
                  duration: coin.duration,
                  delay: coin.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <Badge variant="sun">Sẵn sàng bắt đầu?</Badge>
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl tracking-tight sm:text-5xl">
            Đưa mọi con số về một nơi dễ hiểu.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/70 sm:text-lg">
            Ghi chép hôm nay, hiểu rõ dòng tiền của mình từ ngày mai.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/overview">
                Mở Finance Tracker
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
