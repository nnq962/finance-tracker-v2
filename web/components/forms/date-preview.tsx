import { FieldDescription } from "@/components/ui/field"

const weekdayFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  timeZone: "UTC",
})

/** "Thứ Sáu, 02/10/2026" (· "14:05") from "YYYY-MM-DD" and "HH:mm". */
export function formatDatePreview(date: string, time?: string) {
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return null
  const weekday = weekdayFormatter.format(new Date(Date.UTC(year, month - 1, day)))
  const label = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
  return time ? `${label} · ${time.slice(0, 5)}` : label
}

/**
 * The chosen date written out in Vietnamese order under a native date input,
 * whose own format follows the device language (on an English device
 * 02/10 reads "10/02" and times show AM/PM).
 */
export function DatePreview({ date, time }: { date?: string; time?: string }) {
  const text = date ? formatDatePreview(date, time) : null
  if (!text) return null

  return <FieldDescription aria-live="polite">{text}</FieldDescription>
}
