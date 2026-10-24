"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

const indicatorTones = {
  default: "bg-primary",
  // A second allowance beside the main one (the AI bonus credits): the rail's grey, deeper.
  soft: "bg-muted-foreground/60",
  // Little left of an allowance (2026-10-21).
  warning: "bg-warning",
} as const

/**
 * A bar in the app's ink (white in the dark theme) on a grey rail; `tone`
 * softens it for a second, lesser figure, or turns it amber when little of
 * an allowance is left.
 */
function Progress({
  className,
  value,
  tone = "default",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { tone?: keyof typeof indicatorTones }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("size-full flex-1 rounded-full transition-transform duration-500 ease-out motion-reduce:duration-150", indicatorTones[tone])}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
