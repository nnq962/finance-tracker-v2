"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { MonthPickerSheet } from "@/components/app/month-picker-sheet"
import { Button } from "@/components/ui/button"

/** "Tháng 10, 2026" for "2026-10". */
function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  return `Tháng ${monthNumber}, ${year}`
}

/**
 * The month a page shows, as a pill that opens MonthPickerSheet: the one way
 * to change month, any month two taps away. The caller passes the month just
 * chosen while it loads, so the pill names it at once. `size="bar"`: 44px tall
 * like the round buttons beside it in the page's bar, and short: "Tháng 10"
 * in the year of `max`, "Tháng 10/2025" in another.
 */
export function MonthSelect({
  value,
  max,
  onValueChange,
  size = "sm",
  className,
}: {
  /** "YYYY-MM", the month shown. */
  value: string
  /** "YYYY-MM", the latest month that can be chosen, usually this one. */
  max: string
  onValueChange: (month: string) => void
  size?: "sm" | "bar"
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [year, monthNumber] = value.split("-").map(Number)
  const label =
    size === "bar"
      ? `Tháng ${monthNumber}${String(year) === max.slice(0, 4) ? "" : `/${year}`}`
      : monthLabel(value)

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size={size === "bar" ? "default" : "sm"}
        aria-label={`Đổi tháng, đang xem ${monthLabel(value)}`}
        className={className}
        onClick={() => setOpen(true)}
      >
        {label}
        <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
      </Button>
      <MonthPickerSheet open={open} onOpenChange={setOpen} value={value} max={max} onValueChange={onValueChange} />
    </>
  )
}
