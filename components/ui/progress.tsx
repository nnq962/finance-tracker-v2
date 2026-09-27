"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

const progressTones = {
  leaf: "bg-[oklch(0.76_0.19_138)]",
  sky: "bg-[oklch(0.74_0.14_235)]",
  sun: "bg-[oklch(0.85_0.16_85)]",
  coral: "bg-[oklch(0.70_0.19_25)]",
  grape: "bg-[oklch(0.66_0.17_300)]",
} as const

function Progress({
  className,
  value,
  tone = "leaf",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  tone?: keyof typeof progressTones
}) {
  const progress = typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone}
      value={typeof value === "number" ? progress : value}
      className={cn(
        "relative h-[18px] w-full overflow-hidden rounded-full bg-[#e7e4dd] dark:bg-[#494750]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-500 ease-[cubic-bezier(.3,1.3,.5,1)]",
          progressTones[tone]
        )}
        style={{ width: `${progress}%` }}
      >
        <span aria-hidden="true" className="absolute inset-x-2.5 top-1 h-1 rounded-full bg-white/35" />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
