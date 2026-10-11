"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Bars kept: at one every 70 ms, about three seconds of voice. */
const BARS = 44
const STEP_MS = 70

/**
 * The voice while it is being recorded, as iPhone's Voice Memos shows it
 * (chosen 2026-10-11): thin bars running from right to left, each the level
 * of a moment, the oldest fading out on the left. `level` is read each frame
 * (0 to 1); the bars are drawn straight onto the page, not through React, so
 * a phone draws them smoothly. Reduced motion: the bars stand still and the
 * row only brightens with the voice.
 */
export function VoiceWave({ level, className }: { level: () => number; className?: string }) {
  const row = React.useRef<HTMLDivElement>(null)
  const bars = React.useRef<(HTMLSpanElement | null)[]>([])
  const levelRef = React.useRef(level)
  React.useEffect(() => {
    levelRef.current = level
  })

  React.useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (still) bars.current.forEach((bar) => bar && (bar.style.transform = "scaleY(0.3)"))
    let history: number[] = Array(BARS).fill(0)
    let last = 0
    let frame = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (now - last < STEP_MS) return
      last = now
      const value = Math.max(0, Math.min(1, levelRef.current()))
      if (still) {
        if (row.current) row.current.style.opacity = String(0.35 + value * 0.65)
        return
      }
      history = [...history.slice(1), value]
      bars.current.forEach((bar, index) => {
        if (bar) bar.style.transform = `scaleY(${0.08 + history[index] * 0.92})`
      })
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      ref={row}
      aria-hidden="true"
      className={cn(
        "flex h-12 w-full items-center justify-end gap-[3px] overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_35%)]",
        className,
      )}
    >
      {Array.from({ length: BARS }, (_, index) => (
        <span
          key={index}
          ref={(node) => {
            bars.current[index] = node
          }}
          className="h-full w-[3px] shrink-0 origin-center rounded-full bg-foreground/80"
          style={{ transform: "scaleY(0.08)" }}
        />
      ))}
    </div>
  )
}
