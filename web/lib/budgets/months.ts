/** "YYYY-MM" moved by `by` months; for client and server alike. */
export function shiftMonthKey(month: string, by: number) {
  const [year, index] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, index - 1 + by, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}
