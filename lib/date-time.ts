export type LocalDateTime = {
  date: string
  time: string
}

export function getCurrentLocalDateTime(): LocalDateTime {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()

  return {
    date: localDate.slice(0, 10),
    time: localDate.slice(11, 16),
  }
}

export function getLocalDateTime(isoDate: string): LocalDateTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(new Date(isoDate))
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  }
}
