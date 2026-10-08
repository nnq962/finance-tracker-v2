// One way of writing dates across the app, in Vietnam time:
//   formatDate        02/10/2026
//   formatShortDate   02/10
//   formatWeekday     Thứ Sáu
//   formatDayLabel    Hôm nay, 02/10 · Hôm qua, 01/10 · Thứ Sáu, 25/09
//   formatLongDate    Thứ Sáu, 02/10/2026
//   formatTime        14:05 (24-hour)
// Date-only values are "YYYY-MM-DD" keys; moments are ISO strings or Dates.

const TIME_ZONE = "Asia/Ho_Chi_Minh"

const momentFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

const weekdayFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  timeZone: "UTC",
})

function splitKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-")
  return { year, month: month.padStart(2, "0"), day: day.padStart(2, "0") }
}

function momentParts(value: string | Date) {
  const parts = Object.fromEntries(
    momentFormatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  )
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

/** The Vietnam calendar day of a moment, as "YYYY-MM-DD". */
export function toDateKey(value: string | Date) {
  return momentParts(value).dateKey
}

export function formatDate(dateKey: string) {
  const { year, month, day } = splitKey(dateKey)
  return `${day}/${month}/${year}`
}

export function formatShortDate(dateKey: string) {
  const { month, day } = splitKey(dateKey)
  return `${day}/${month}`
}

export function formatWeekday(dateKey: string) {
  const { year, month, day } = splitKey(dateKey)
  const weekday = weekdayFormatter.format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))))
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

/** The date key of the day before, across months and years. */
function previousDateKey(dateKey: string) {
  const { year, month, day } = splitKey(dateKey)
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) - 1)).toISOString().slice(0, 10)
}

/**
 * "Hôm nay, 02/10" for today and "Hôm qua, 01/10" for the day before, as
 * phone apps say them; other days by weekday, "Thứ Sáu, 25/09". Without
 * `today` every day goes by its weekday.
 */
export function formatDayLabel(dateKey: string, today?: string) {
  return `${dayName(dateKey, today)}, ${formatShortDate(dateKey)}`
}

function dayName(dateKey: string, today?: string) {
  if (dateKey === today) return "Hôm nay"
  if (today && dateKey === previousDateKey(today)) return "Hôm qua"
  return formatWeekday(dateKey)
}

export function formatLongDate(dateKey: string) {
  return `${formatWeekday(dateKey)}, ${formatDate(dateKey)}`
}

/** "14:05" in Vietnam time. */
export function formatTime(value: string | Date) {
  return momentParts(value).time
}
