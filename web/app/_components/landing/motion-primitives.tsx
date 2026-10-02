"use client"

import { useEffect, useRef, type ReactNode } from "react"
import {
  animate,
  motion,
  MotionConfig,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react"

import { formatCurrency } from "@/lib/format-currency"

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export function LandingMotionConfig({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number
  y?: number
}

export function Reveal({ delay = 0, y = 24, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

type CountUpProps = {
  value: number
  signDisplay?: "auto" | "always"
  duration?: number
  delay?: number
  className?: string
}

export function CountUp({
  value,
  signDisplay = "auto",
  duration = 1.6,
  delay = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!inView || !node || reduceMotion) return

    const controls = animate(0, value, {
      duration,
      delay,
      ease: EASE_OUT,
      onUpdate: (latest) => {
        node.textContent = formatCurrency(Math.round(latest), { signDisplay })
      },
    })

    return () => controls.stop()
  }, [delay, duration, inView, reduceMotion, signDisplay, value])

  return (
    <span ref={ref} className={className}>
      {formatCurrency(value, { signDisplay })}
    </span>
  )
}
