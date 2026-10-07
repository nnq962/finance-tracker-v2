"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

/**
 * A month chosen from a bottom sheet: the year with arrows, then its twelve
 * months as a grid. Months after `max` cannot be chosen; the one shown is
 * dark. Choosing one closes the sheet.
 */
export function MonthPickerSheet({
  open,
  onOpenChange,
  value,
  max,
  onValueChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "YYYY-MM", the month shown. */
  value: string
  /** "YYYY-MM", the latest month that can be chosen, usually this one. */
  max: string
  onValueChange: (month: string) => void
}) {
  const maxYear = Number(max.slice(0, 4))
  const [year, setYear] = React.useState(Number(value.slice(0, 4)))
  // Each time it opens, on the year of the month shown.
  const [shownFor, setShownFor] = React.useState(open)
  if (open !== shownFor) {
    setShownFor(open)
    if (open) setYear(Number(value.slice(0, 4)))
  }

  const choose = (month: string) => {
    onOpenChange(false)
    if (month !== value) onValueChange(month)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined}>
        <div className="px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
          <DrawerTitle className="text-center text-base font-medium">Chọn tháng</DrawerTitle>

          <div className="mt-3 flex items-center justify-between">
            <Button type="button" variant="secondary" size="icon" aria-label="Năm trước" onClick={() => setYear(year - 1)}>
              <ChevronLeftIcon />
            </Button>
            <span className="text-xl font-medium tabular-nums" aria-live="polite">
              {year}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Năm sau"
              disabled={year >= maxYear}
              onClick={() => setYear(year + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, index) => {
              const month = `${year}-${String(index + 1).padStart(2, "0")}`
              const selected = month === value
              const later = month > max
              return (
                <button
                  key={month}
                  type="button"
                  disabled={later}
                  aria-current={selected || undefined}
                  aria-label={`Tháng ${index + 1}, ${year}`}
                  onClick={() => choose(month)}
                  className={cn(
                    "pressable h-14 rounded-xl text-sm font-medium tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                    selected ? "bg-primary text-primary-foreground" : "bg-field",
                    later && "bg-transparent text-muted-foreground/50",
                  )}
                >
                  Th {index + 1}
                </button>
              )
            })}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mt-5 w-full"
            disabled={value === max}
            onClick={() => choose(max)}
          >
            Về tháng này
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
