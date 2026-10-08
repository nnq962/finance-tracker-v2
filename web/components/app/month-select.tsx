"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { MonthPickerSheet } from "@/components/app/month-picker-sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** "Tháng 10, 2026" for "2026-10". */
function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  return `Tháng ${monthNumber}, ${year}`
}

/**
 * The month a page shows, as a pill that opens MonthPickerSheet: the one way
 * to change month, any month two taps away. The caller passes the month just
 * chosen while it loads, so the pill names it at once. `variant="eyebrow"`:
 * plain text in the page header's eyebrow, its small capitals and colour, with
 * a 44px touch area around it.
 */
export function MonthSelect({
  value,
  max,
  onValueChange,
  variant = "pill",
  className,
}: {
  /** "YYYY-MM", the month shown. */
  value: string
  /** "YYYY-MM", the latest month that can be chosen, usually this one. */
  max: string
  onValueChange: (month: string) => void
  variant?: "pill" | "eyebrow"
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const label = monthLabel(value)
  const ariaLabel = `Đổi tháng, đang xem ${label}`

  return (
    <>
      {variant === "eyebrow" ? (
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "relative flex items-center gap-1 uppercase outline-none after:absolute after:-inset-x-2 after:-inset-y-3 focus-visible:underline active:opacity-60",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          {label}
          <ChevronDownIcon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
        </button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={ariaLabel}
          className={className}
          onClick={() => setOpen(true)}
        >
          {label}
          <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      )}
      <MonthPickerSheet open={open} onOpenChange={setOpen} value={value} max={max} onValueChange={onValueChange} />
    </>
  )
}
