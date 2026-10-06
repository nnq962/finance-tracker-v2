"use client"

import { MinusIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A count changed one step at a time: − and + on white circles inside a grey
 * pill, the number between them. For small whole numbers (people, months).
 */
export function Stepper({
  value,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  className,
}: {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** What is counted, for screen readers, e.g. "Số người". */
  label: string
  className?: string
}) {
  const button =
    "relative grid size-9 shrink-0 place-items-center rounded-full bg-card shadow-xs transition-[scale,opacity] duration-150 after:absolute after:-inset-1 active:scale-90 disabled:opacity-30 disabled:active:scale-100 dark:bg-accent [&_svg]:size-4"

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex h-11 w-full min-w-0 items-center justify-between rounded-full bg-field p-1", className)}
    >
      <button
        type="button"
        aria-label="Giảm"
        disabled={value - step < min}
        onClick={() => onValueChange(value - step)}
        className={button}
      >
        <MinusIcon />
      </button>
      <span
        key={value}
        aria-live="polite"
        className="min-w-0 flex-1 text-center text-base font-medium tabular-nums motion-safe:animate-in motion-safe:zoom-in-90 motion-safe:fade-in-50"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Tăng"
        disabled={value + step > max}
        onClick={() => onValueChange(value + step)}
        className={button}
      >
        <PlusIcon />
      </button>
    </div>
  )
}
