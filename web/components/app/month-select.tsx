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
 * chosen while it loads, so the pill names it at once.
 */
export function MonthSelect({
  value,
  max,
  onValueChange,
  className,
}: {
  /** "YYYY-MM", the month shown. */
  value: string
  /** "YYYY-MM", the latest month that can be chosen, usually this one. */
  max: string
  onValueChange: (month: string) => void
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const label = monthLabel(value)

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={`Đổi tháng, đang xem ${label}`}
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
