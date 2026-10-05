"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

// The old Chunky tone names, kept for callers: leaf is the default black bar.
const progressTones = {
  leaf: "bg-primary",
  sky: "bg-transfer",
  sun: "bg-amber-500",
  coral: "bg-expense",
  grape: "bg-violet-500",
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
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-500 ease-out",
          progressTones[tone]
        )}
        style={{ width: `${progress}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
