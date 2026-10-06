"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const ITEM_HEIGHT = 40

/** Wheels side by side over one highlight band, like iOS's time picker. */
export function WheelPickerGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-field"
      />
      {children}
    </div>
  )
}

/**
 * One scrolling wheel: the row that stops in the middle is the value. Scrolls
 * with the finger (snapping to rows) or with the arrow keys.
 */
export function WheelPicker({
  items,
  value,
  onValueChange,
  label,
  className,
}: {
  items: readonly string[]
  /** The chosen item's index. */
  value: number
  onValueChange: (index: number) => void
  label: string
  className?: string
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const id = React.useId()

  React.useEffect(() => {
    const element = scroller.current
    if (element && Math.round(element.scrollTop / ITEM_HEIGHT) !== value) {
      element.scrollTo({ top: value * ITEM_HEIGHT })
    }
  }, [value])

  return (
    <div
      ref={scroller}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`${id}-${value}`}
      onScroll={(event) => {
        const index = Math.round(event.currentTarget.scrollTop / ITEM_HEIGHT)
        const clamped = Math.min(items.length - 1, Math.max(0, index))
        if (clamped !== value) onValueChange(clamped)
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
        event.preventDefault()
        const next = Math.min(items.length - 1, Math.max(0, value + (event.key === "ArrowDown" ? 1 : -1)))
        scroller.current?.scrollTo({ top: next * ITEM_HEIGHT, behavior: "smooth" })
      }}
      className={cn(
        "relative h-[200px] flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl py-20 outline-none [mask-image:linear-gradient(transparent,black_35%,black_65%,transparent)] focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={item}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === value}
          className={cn(
            "grid h-10 snap-center place-items-center text-xl tabular-nums transition-[scale,color] duration-150",
            index === value ? "font-medium" : "scale-90 text-muted-foreground",
          )}
        >
          {item}
        </div>
      ))}
    </div>
  )
}
