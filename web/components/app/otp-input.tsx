"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A one-time code in separate boxes. Typing moves to the next box, Backspace
 * on an empty box goes back, and a pasted code fills every box.
 */
export function OtpInput({
  value,
  onValueChange,
  length = 6,
  label = "Mã xác nhận",
  invalid,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  length?: number
  label?: string
  invalid?: boolean
  className?: string
}) {
  const inputs = React.useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, index) => value[index] ?? "")

  const setFrom = (index: number, typed: string) => {
    const clean = typed.replace(/\D/g, "")
    if (!clean) return
    const next = (value.slice(0, index) + clean).slice(0, length)
    onValueChange(next)
    inputs.current[Math.min(next.length, length - 1)]?.focus()
  }

  return (
    <div role="group" aria-label={label} className={cn("flex justify-between gap-2", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Số thứ ${index + 1}`}
          aria-invalid={invalid || undefined}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const typed = event.target.value.replace(digit, "") || event.target.value
            setFrom(index, typed)
          }}
          onPaste={(event) => {
            event.preventDefault()
            setFrom(index, event.clipboardData.getData("text"))
          }}
          onKeyDown={(event) => {
            if (event.key !== "Backspace") return
            event.preventDefault()
            if (digit) onValueChange(value.slice(0, index))
            else if (index > 0) {
              onValueChange(value.slice(0, index - 1))
              inputs.current[index - 1]?.focus()
            }
          }}
          className={cn(
            "h-14 w-full min-w-0 rounded-2xl bg-field text-center text-xl font-medium tabular-nums caret-primary outline-none transition-[background-color,box-shadow] duration-150 focus:bg-card focus:ring-2 focus:ring-primary aria-invalid:ring-2 aria-invalid:ring-destructive",
            digit && "motion-safe:animate-in motion-safe:zoom-in-90",
          )}
        />
      ))}
    </div>
  )
}
