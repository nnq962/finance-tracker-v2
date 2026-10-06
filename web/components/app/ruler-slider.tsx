"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A ruler for picking a value by dragging: ticks every two units (longer every
 * tenth), filled up to the needle. Arrow keys move one step.
 */
export function RulerSlider({
  value,
  onValueChange,
  min = 0,
  max = 80,
  label,
  className,
}: {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  label: string
  className?: string
}) {
  const ruler = React.useRef<HTMLDivElement>(null)
  const ticks = Math.floor((max - min) / 2)
  const percent = ((value - min) / (max - min)) * 100

  const setFromPointer = (clientX: number) => {
    const box = ruler.current?.getBoundingClientRect()
    if (!box) return
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width))
    onValueChange(Math.round(min + ratio * (max - min)))
  }

  return (
    <div
      ref={ruler}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        setFromPointer(event.clientX)
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromPointer(event.clientX)
      }}
      onKeyDown={(event) => {
        const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key]
        if (!step) return
        event.preventDefault()
        onValueChange(Math.min(max, Math.max(min, value + step)))
      }}
      className={cn(
        "relative h-16 cursor-grab touch-none rounded-xl outline-none select-none [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)] focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing",
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0 flex items-end justify-between pb-3">
        {Array.from({ length: ticks + 1 }, (_, index) => (
          <span
            key={index}
            className={cn(
              "w-0.5 rounded-full transition-[background-color] duration-150",
              index % 5 ? "h-3" : "h-6",
              (index / ticks) * 100 <= percent ? "bg-foreground" : "bg-input",
            )}
          />
        ))}
      </div>
      <span
        aria-hidden="true"
        className="absolute bottom-1.5 h-10 w-1 -translate-x-1/2 rounded-full bg-warning shadow-[0_0_0_3px_color-mix(in_oklch,var(--warning)_20%,transparent)]"
        style={{ left: `${percent}%` }}
      />
    </div>
  )
}
