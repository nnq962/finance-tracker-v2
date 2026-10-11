"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** One bar every 70 ms; 3px bars 3px apart. */
const STEP_MS = 70
const BAR_PX = 3
const GAP_PX = 3
/** Bars before the row is measured, about three seconds of voice; and the most it keeps. */
const FIRST_BARS = 44
const MOST_BARS = 400

/**
 * The voice while it is being recorded, as iPhone's Voice Memos shows it
 * (chosen 2026-10-11): thin bars gliding from right to left, each the level
 * of a moment, the oldest fading out on the left. As many bars as fit across
 * the row, so it is filled at any width. The row slides on every frame rather
 * than jumping a bar at a time, and the newest bar, coming in at the right,
 * follows the voice as it changes. `level` is read each frame (0 to 1); the
 * bars are drawn straight onto the page, not through React, and move by
 * transform only, so a phone draws them smoothly. Reduced motion: the bars
 * stand still and the row only brightens with the voice.
 */
export function VoiceWave({ level, className }: { level: () => number; className?: string }) {
  const row = React.useRef<HTMLDivElement>(null)
  const track = React.useRef<HTMLDivElement>(null)
  const bars = React.useRef<(HTMLSpanElement | null)[]>([])
  const levelRef = React.useRef(level)
  React.useEffect(() => {
    levelRef.current = level
  })
  const [count, setCount] = React.useState(FIRST_BARS)
  React.useLayoutEffect(() => {
    const element = row.current
    if (!element) return
    const observer = new ResizeObserver(() =>
      setCount(Math.max(1, Math.min(MOST_BARS, Math.floor((element.clientWidth + GAP_PX) / (BAR_PX + GAP_PX))))),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  // The bars on the page: those that fit, and one more coming in at the right.
  React.useLayoutEffect(() => {
    bars.current.length = count + 1
  }, [count])

  React.useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const scale = (value: number) => `scaleY(${0.08 + value * 0.92})`
    if (still) bars.current.forEach((bar) => bar && (bar.style.transform = "scaleY(0.3)"))
    // Each bar's level, the newest last; `live` is the bar coming in.
    let history: number[] = Array(MOST_BARS).fill(0)
    let live = 0
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const value = Math.max(0, Math.min(1, levelRef.current()))
      if (still) {
        if (row.current) row.current.style.opacity = String(0.35 + value * 0.65)
        return
      }
      // The newest bar eases towards the voice, so it grows rather than flickers.
      live += (value - live) * 0.35
      const shown = bars.current
      if (now - last >= STEP_MS) {
        // It has come all the way in: it joins the rest, and a new one starts.
        last = now - ((now - last) % STEP_MS)
        history = [...history.slice(1), live]
        const offset = MOST_BARS - (shown.length - 1)
        shown.forEach((bar, index) => {
          if (bar && index < shown.length - 1) bar.style.transform = scale(history[offset + index])
        })
      }
      const newest = shown[shown.length - 1]
      if (newest) newest.style.transform = scale(live)
      // From one bar's width off the right edge to resting at it.
      const progress = Math.min(1, (now - last) / STEP_MS)
      if (track.current) track.current.style.transform = `translate3d(${(1 - progress) * (BAR_PX + GAP_PX)}px, 0, 0)`
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      ref={row}
      aria-hidden="true"
      // Its own paint box: the bars slide on every frame, and without it the
      // browser's layer for them reached past the row (the newest bar comes in
      // from beyond the right edge) over the button beside it, whose hover
      // background then flickered as both were redrawn.
      className={cn(
        "relative isolate h-12 w-full overflow-hidden [contain:paint]",
        "[mask-image:linear-gradient(to_right,transparent,black_35%)]",
        className,
      )}
    >
      <div ref={track} className="absolute inset-y-0 right-0 flex items-center gap-[3px] will-change-transform">
        {Array.from({ length: count + 1 }, (_, index) => (
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
    </div>
  )
}
