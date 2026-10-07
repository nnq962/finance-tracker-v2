"use client"

import * as React from "react"

import { MonthPickerSheet } from "@/components/app/month-picker-sheet"
import { cn } from "@/lib/utils"

// The tabs reach a year back; older months are chosen from the sheet.
const TAB_MONTHS = 12

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, monthIndex - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function tabLabel(month: string, thisMonth: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  return year === Number(thisMonth.slice(0, 4)) ? `Tháng ${monthNumber}` : `Tháng ${monthNumber}/${String(year).slice(2)}`
}

/**
 * The month on show, as a row of tabs that scrolls sideways: the last twelve
 * months, newest on the right, and "Cũ hơn" at the start for anything older.
 * The tapped tab is chosen at once while its month loads (`pending`), so the
 * row answers the finger even when the data takes a moment.
 */
export function MonthTabs({
  value,
  max,
  onValueChange,
  pending = false,
  className,
}: {
  /** "YYYY-MM", the month shown. */
  value: string
  /** "YYYY-MM", the newest month, usually this one. */
  max: string
  onValueChange: (month: string) => void
  /** The month is loading; the tab stays chosen and dims a little. */
  pending?: boolean
  className?: string
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const months = Array.from({ length: TAB_MONTHS }, (_, index) => shiftMonth(max, index - (TAB_MONTHS - 1)))
  // A month older than the tabs gets one of its own, after "Cũ hơn".
  const shown = months.includes(value) ? months : [value, ...months]

  const row = React.useRef<HTMLDivElement>(null)
  // The chosen tab scrolls into view: straight away the first time, smoothly after.
  const scrolled = React.useRef(false)
  React.useEffect(() => {
    const container = row.current
    const tab = container?.querySelector<HTMLElement>("[aria-selected=true]")
    if (!container || !tab) return
    const left = tab.offsetLeft - (container.clientWidth - tab.offsetWidth) / 2
    container.scrollTo({ left, behavior: scrolled.current ? "smooth" : "instant" })
    scrolled.current = true
  }, [value])

  const choose = (month: string) => {
    if (month !== value) onValueChange(month)
  }

  return (
    <>
      <div
        ref={row}
        role="tablist"
        aria-label="Chọn tháng"
        className={cn(
          "-mx-(--main-content-px) flex gap-1 overflow-x-auto px-(--main-content-px) overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="pressable h-11 shrink-0 rounded-full px-4 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          Cũ hơn
        </button>
        {shown.map((month) => {
          const selected = month === value
          return (
            <button
              key={month}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => choose(month)}
              className={cn(
                "pressable h-11 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap outline-none transition-[background-color,color,opacity] duration-200 focus-visible:ring-3 focus-visible:ring-ring/30",
                selected ? "bg-card text-foreground" : "text-muted-foreground",
                selected && pending && "opacity-60",
              )}
            >
              {tabLabel(month, max)}
            </button>
          )
        })}
      </div>
      <MonthPickerSheet open={pickerOpen} onOpenChange={setPickerOpen} value={value} max={max} onValueChange={choose} />
    </>
  )
}
