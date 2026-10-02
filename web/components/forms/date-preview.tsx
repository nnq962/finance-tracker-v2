import { FieldDescription } from "@/components/ui/field"
import { formatLongDate } from "@/lib/format-date"

/** "Thứ Sáu, 02/10/2026" (· "14:05") from "YYYY-MM-DD" and "HH:mm". */
export function formatDatePreview(date: string, time?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const label = formatLongDate(date)
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
