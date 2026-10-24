"use client"

import { CalendarDaysIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

/** "Thứ Bảy, 24 tháng 10" for "2026-10-24". */
function dayLabel(today: string) {
  const [year, month, day] = today.split("-").map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return `${weekdays[weekday]}, ${day} tháng ${month}`
}

/**
 * Today in the middle of the overview's bar (2026-10-24, the user's picture):
 * a raised pill with a calendar; a tap goes down to the month's calendar.
 */
export function TodayPill({ today }: { today: string }) {
  return (
    <Button
      type="button"
      variant="elevated"
      className="max-w-full min-w-0 gap-2 px-4 text-[15px]"
      onClick={() => {
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        document.getElementById("overview-month")?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" })
      }}
    >
      <CalendarDaysIcon className="text-muted-foreground" />
      <span className="truncate">{dayLabel(today)}</span>
    </Button>
  )
}
