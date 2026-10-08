"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Collapse } from "@/components/app/collapse"
import { SettingsRow } from "@/components/settings-list"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatDayLabel } from "@/lib/format-date"
import { cn } from "@/lib/utils"

/** The date key `days` before `dateKey`. */
function shiftDate(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

/** "Hôm nay, 20:02", "Hôm qua, 12:30", else "Thứ Ba, 06/10 · 17:00". */
function timeLabel(date: string, time: string, today: string) {
  if (date === today) return `Hôm nay, ${time}`
  if (date === shiftDate(today, 1)) return `Hôm qua, ${time}`
  return `${formatDayLabel(date)} · ${time}`
}

/**
 * When a transaction happened, as rows of a group: "Thời gian … Hôm nay,
 * 20:02", with today, yesterday and the day before as chips under it, and the
 * date and time fields (the phone's own pickers) folded under the row, open
 * from a tap on it. Submitted as date and time. Rendered as list items of the
 * group it sits in.
 */
export function TimeRows({
  date,
  time,
  today,
  onDateChange,
  onTimeChange,
  invalid,
}: {
  /** "YYYY-MM-DD". */
  date: string
  /** "HH:mm". */
  time: string
  /** "YYYY-MM-DD" in Vietnam time, the latest day that can be chosen. */
  today: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  invalid: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const quickDays = [
    { key: today, label: "Hôm nay" },
    { key: shiftDate(today, 1), label: "Hôm qua" },
    { key: shiftDate(today, 2), label: "Hôm kia" },
  ]

  return (
    <>
      {/* Only the value is the button: a whole-row button greyed the full
          width when pressed or hovered, its edge right on the chips below. */}
      <SettingsRow
        title="Thời gian"
        action={
          <button
            id="transaction-date-row"
            type="button"
            aria-expanded={open}
            aria-label={`Thời gian: ${timeLabel(date, time, today)}. Chọn ngày giờ`}
            onClick={() => setOpen((current) => !current)}
            className={cn(
              "-mr-2 inline-flex h-11 items-center gap-1 rounded-full px-2 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 active:bg-muted",
              invalid && "text-destructive",
            )}
          >
            {timeLabel(date, time, today)}
            <ChevronDownIcon
              aria-hidden="true"
              className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")}
            />
          </button>
        }
      />
      {/* No divider: the chips and the fields belong to the row above. The
          same 24px above the chips (from the row's text, the row keeping its
          own room under it), between them and the fields, and under the last. */}
      <li className="flex flex-col px-4 pt-0.5 pb-6">
        <ToggleGroup
          type="single"
          size="sm"
          value={quickDays.some((day) => day.key === date) ? date : ""}
          onValueChange={(next) => {
            if (next) onDateChange(next)
          }}
          aria-label="Chọn nhanh ngày"
        >
          {quickDays.map((day) => (
            <ToggleGroupItem key={day.key} value={day.key}>
              {day.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Collapse open={open}>
          <div className="grid grid-cols-2 gap-3 pt-6">
            <Input
              id="transaction-date"
              aria-label="Ngày"
              type="date"
              name="date"
              value={date}
              min="2000-01-01"
              max={today}
              onChange={(event) => onDateChange(event.target.value)}
              aria-invalid={invalid || undefined}
            />
            <Input
              id="transaction-time"
              aria-label="Giờ"
              type="time"
              name="time"
              value={time}
              onChange={(event) => onTimeChange(event.target.value)}
              aria-invalid={invalid || undefined}
            />
          </div>
        </Collapse>
      </li>
    </>
  )
}
