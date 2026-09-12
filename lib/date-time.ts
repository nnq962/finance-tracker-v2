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
