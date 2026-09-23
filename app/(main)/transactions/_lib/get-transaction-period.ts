import type {
  Transaction,
  TransactionPeriod,
} from "../_types/transaction"

const vietnamDateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
})

export function getTransactionDateKey(occurredAt: string | Date) {
  const parts = vietnamDateFormatter.formatToParts(new Date(occurredAt))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)

  return new Date(Date.UTC(year, month - 1, day))
}

function formatDateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

function formatWeekRange(startDate: Date, endDate: Date) {
  const startDay = String(startDate.getUTCDate()).padStart(2, "0")
  const endDay = String(endDate.getUTCDate()).padStart(2, "0")
  const startMonth = String(startDate.getUTCMonth() + 1).padStart(2, "0")
  const endMonth = String(endDate.getUTCMonth() + 1).padStart(2, "0")
  const isSameMonth =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
    startDate.getUTCMonth() === endDate.getUTCMonth()

  return isSameMonth
    ? `${startDay}-${endDay}/${endMonth}`
    : `${startDay}/${startMonth}-${endDay}/${endMonth}`
}

function getWeekStart(date: Date) {
  const startDate = new Date(date)
  const dayFromMonday = (date.getUTCDay() + 6) % 7

  startDate.setUTCDate(date.getUTCDate() - dayFromMonday)

  return startDate
}

function formatRelativePeriod(period: TransactionPeriod, offset: number) {
  const periodLabel = period === "week" ? "tuần" : "tháng"

  if (offset === 0) return `${periodLabel} này`
  if (offset === 1) return `${periodLabel} trước`
  if (offset < 0) return `${Math.abs(offset)} ${periodLabel} sau`

  return `${offset} ${periodLabel} trước`
}

export function getLastNavigableDateKey(
  transactions: Transaction[],
  todayDateKey: string,
) {
  return transactions.reduce(
    (latest, transaction) => {
      const dateKey = getTransactionDateKey(transaction.occurredAt)
      return dateKey > latest ? dateKey : latest
    },
    todayDateKey,
  )
}

export function shiftPeriodAnchor(
  anchorDateKey: string,
  period: TransactionPeriod,
  amount: number,
) {
  const date = parseDateKey(anchorDateKey)

  if (period === "week") {
    date.setUTCDate(date.getUTCDate() + amount * 7)
  } else {
    return formatDateKey(
      new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)),
    )
  }

  return formatDateKey(date)
}

export function getTransactionPeriod(
  transactions: Transaction[],
  period: TransactionPeriod,
  anchorDateKey: string,
  todayDateKey: string,
  lastNavigableDateKey: string,
) {
  const anchorDate = parseDateKey(anchorDateKey)
  const year = anchorDate.getUTCFullYear()
  const month = anchorDate.getUTCMonth() + 1

  if (period === "month") {
    const monthKey = anchorDateKey.slice(0, 7)
    const todayDate = parseDateKey(todayDateKey)
    const monthOffset =
      (todayDate.getUTCFullYear() - year) * 12 +
      todayDate.getUTCMonth() -
      anchorDate.getUTCMonth()

    return {
      rangeLabel: `Tháng ${String(month).padStart(2, "0")}, ${year}`,
      contextLabel: formatRelativePeriod(period, monthOffset),
      isCurrent: anchorDateKey.slice(0, 7) === todayDateKey.slice(0, 7),
      isLatest: anchorDateKey.slice(0, 7) >= lastNavigableDateKey.slice(0, 7),
      transactions: transactions.filter((transaction) =>
        getTransactionDateKey(transaction.occurredAt).startsWith(monthKey),
      ),
    }
  }

  const startDate = getWeekStart(anchorDate)
  const todayWeekStart = getWeekStart(parseDateKey(todayDateKey))
  const weekOffset = Math.round(
    (todayWeekStart.getTime() - startDate.getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  )

  const endDate = new Date(startDate)
  endDate.setUTCDate(startDate.getUTCDate() + 6)

  const startDateKey = formatDateKey(startDate)
  const endDateKey = formatDateKey(endDate)

  return {
    rangeLabel: formatWeekRange(startDate, endDate),
    contextLabel: formatRelativePeriod(period, weekOffset),
    isCurrent: todayDateKey >= startDateKey && todayDateKey <= endDateKey,
    isLatest: startDateKey >= formatDateKey(
      getWeekStart(parseDateKey(lastNavigableDateKey)),
    ),
    transactions: transactions.filter((transaction) => {
      const dateKey = getTransactionDateKey(transaction.occurredAt)

      return dateKey >= startDateKey && dateKey <= endDateKey
    }),
  }
}
