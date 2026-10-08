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

/** "Hôm nay, 20:02", "Hôm qua, 12:30", else "Thứ Ba, 06/10 · 17:00"; without a time "Hôm nay", "Thứ Ba, 06/10". */
function timeLabel(date: string, time: string | undefined, today: string) {
  // A field cleared (a picker's Clear, a deleted segment) leaves nothing to name.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Chọn ngày"
  if (time === undefined) {
    if (date === today) return "Hôm nay"
    if (date === shiftDate(today, 1)) return "Hôm qua"
    return formatDayLabel(date)
  }
  if (!/^\d{2}:\d{2}/.test(time)) time = "--:--"
  if (date === today) return `Hôm nay, ${time}`
  if (date === shiftDate(today, 1)) return `Hôm qua, ${time}`
  return `${formatDayLabel(date)} · ${time}`
}

/**
 * When something happened, as rows of a group: "Thời gian … Hôm nay,
 * 20:02", with today, yesterday and the day before as chips under it (unless
 * `quickDays` is off), and the date and time fields (the phone's own pickers)
 * folded under the row, open from a tap on it. Submitted as date and time,
 * from 2000 (or `min`) through today. Without `time` it is a day alone (a
 * debt's), with the date field only. Rendered as list items of the group it
 * sits in.
 */
export function TimeRows({
  idPrefix,
  title = "Thời gian",
  quickDays: withQuickDays = true,
  date,
  time,
  today,
  min = "2000-01-01",
  onDateChange,
  onTimeChange,
  invalid,
}: {
  /** The row is `<idPrefix>-date-row`, for focusing it when the time is wrong; the fields `<idPrefix>-date` and `-time`. */
  idPrefix: string
  title?: string
  /** Today, yesterday and the day before as chips under the row, for what is mostly entered as it happens. */
  quickDays?: boolean
  /** "YYYY-MM-DD". */
  date: string
  /** "HH:mm"; none for a day alone. */
  time?: string
  /** "YYYY-MM-DD" in Vietnam time, the latest day that can be chosen. */
  today: string
  /** The earliest day that can be chosen. */
  min?: string
  onDateChange: (date: string) => void
  onTimeChange?: (time: string) => void
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
      <SettingsRow
        id={`${idPrefix}-date-row`}
        title={title}
        value={
          <span className={cn("flex items-center gap-1", invalid && "text-destructive")}>
            {timeLabel(date, time, today)}
            <ChevronDownIcon
              aria-hidden="true"
              className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")}
            />
          </span>
        }
        chevron={false}
        expanded={open}
        onClick={() => setOpen((current) => !current)}
      />
      {/* No divider: the chips and the fields belong to the row above, with
          8px above and below the chips, and 8px under the fields to the line;
          without chips, 8px above and below the fields, inside the fold so
          nothing is left once folded. */}
      <li className={cn("flex flex-col px-4", withQuickDays && "py-2")}>
        {withQuickDays ? (
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
        ) : null}
        <Collapse open={open}>
          <div className={cn("grid gap-3", time === undefined ? "grid-cols-1" : "grid-cols-2", withQuickDays ? "pt-2" : "py-2")}>
            <Input
              id={`${idPrefix}-date`}
              aria-label="Ngày"
              type="date"
              name="date"
              value={date}
              min={min}
              max={today}
              onChange={(event) => onDateChange(event.target.value)}
              aria-invalid={invalid || undefined}
            />
            {time === undefined ? null : (
              <Input
                id={`${idPrefix}-time`}
                aria-label="Giờ"
                type="time"
                name="time"
                value={time}
                onChange={(event) => onTimeChange?.(event.target.value)}
                aria-invalid={invalid || undefined}
              />
            )}
          </div>
        </Collapse>
      </li>
    </>
  )
}
