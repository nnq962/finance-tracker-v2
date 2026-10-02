import { formatTime, toDateKey } from "@/lib/format-date"

export type LocalDateTime = {
  date: string
  time: string
}

/** Now in Vietnam time, which the server also validates in, whatever the
 * device's own time zone. */
export function getCurrentLocalDateTime(): LocalDateTime {
  return getLocalDateTime(new Date())
}

export function getLocalDateTime(value: string | Date): LocalDateTime {
  return { date: toDateKey(value), time: formatTime(value) }
}
