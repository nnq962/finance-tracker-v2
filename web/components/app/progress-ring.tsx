"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const sizeClassName = {
  sm: "size-16",
  md: "size-28",
} as const

/**
 * Progress as a thin ring around its count, e.g. missions done: a light
 * track and a dark arc from twelve o'clock, the value and a label inside.
 * The arc sweeps in when the ring first shows, and moves on to a new value.
 */
export function ProgressRing({
  value,
  max,
  label,
  size = "md",
  className,
}: {
  value: number
  max: number
  /** Below the count, e.g. "đã xong"; also read out with it. */
  label?: string
  size?: keyof typeof sizeClassName
  className?: string
}) {
  // The circle's length for r=16, so the dash is the share done.
  const length = 2 * Math.PI * 16
  // The arc is drawn empty first and sweeps to its value a frame later, each
  // time the ring appears (opening the page from the tab bar too); after the
  // page has come to life, as a sweep while it loads would stall and jump.
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setReady(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  const share = ready && max > 0 ? Math.min(value / max, 1) : 0

  return (
    <div
      data-slot="progress-ring"
      role="img"
      aria-label={`${value}/${max}${label ? ` ${label}` : ""}`}
      className={cn("relative shrink-0", sizeClassName[size], className)}
    >
      <svg viewBox="0 0 36 36" aria-hidden="true" className="size-full -rotate-90">
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="0.8" className="stroke-muted" />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray={`${share * length} ${length}`}
          className={cn(
            "stroke-primary motion-safe:transition-[stroke-dasharray] motion-safe:duration-900 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
            // An empty arc's round cap would still draw a dot at twelve o'clock.
            share === 0 && "opacity-0",
          )}
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 grid place-content-center text-center">
        <p className={cn("font-semibold tabular-nums", size === "md" ? "text-2xl" : "text-sm")}>
          {value}/{max}
        </p>
        {label && size === "md" ? <p className="text-[10px] text-muted-foreground">{label}</p> : null}
      </div>
    </div>
  )
}
