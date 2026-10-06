"use client"

import { cn } from "@/lib/utils"

const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/**
 * A week of days in a row for picking one: weekday above the date, the chosen
 * day dark. A dot marks days with something on them (e.g. a bill due).
 */
export function DateStrip({
  days,
  value,
  onValueChange,
  marked,
  className,
}: {
  days: Date[]
  value: Date
  onValueChange: (day: Date) => void
  marked?: (day: Date) => boolean
  className?: string
}) {
  return (
    <div className={cn("grid gap-1.5", className)} style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
      {days.map((day) => {
        const chosen = sameDay(day, value)
        return (
          <button
            key={day.toISOString()}
            type="button"
            aria-pressed={chosen}
            aria-label={day.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })}
            onClick={() => onValueChange(day)}
            className={cn(
              "pressable flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-colors duration-150",
              chosen && "bg-primary text-primary-foreground",
            )}
          >
            <span className={cn("text-[11px]", chosen ? "opacity-60" : "text-muted-foreground")}>
              {weekdays[day.getDay()]}
            </span>
            <span className="text-sm font-medium tabular-nums">{day.getDate()}</span>
            <span
              aria-hidden="true"
              className={cn(
                "size-1 rounded-full",
                marked?.(day) ? (chosen ? "bg-primary-foreground" : "bg-warning") : "bg-transparent",
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
