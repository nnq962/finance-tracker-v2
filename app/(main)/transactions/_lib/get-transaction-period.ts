import type {
  Transaction,
  TransactionPeriod,
} from "../_types/transaction"

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

  return `${offset} ${periodLabel} trước`
}

export function getLatestTransactionDateKey(transactions: Transaction[]) {
  return transactions.reduce(
    (latest, transaction) =>
      transaction.occurredAt.slice(0, 10) > latest
        ? transaction.occurredAt.slice(0, 10)
        : latest,
    "0000-00-00",
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
    date.setUTCMonth(date.getUTCMonth() + amount)
  }

  return formatDateKey(date)
}

export function getTransactionPeriod(
  transactions: Transaction[],
  period: TransactionPeriod,
  anchorDateKey: string,
  latestDateKey: string,
) {
  if (anchorDateKey === "0000-00-00") {
    return {
      rangeLabel: "Chưa có dữ liệu",
      contextLabel: "kỳ hiện tại",
      isCurrent: true,
      transactions: [],
    }
  }

  const anchorDate = parseDateKey(anchorDateKey)
  const year = anchorDate.getUTCFullYear()
  const month = anchorDate.getUTCMonth() + 1

  if (period === "month") {
    const monthKey = anchorDateKey.slice(0, 7)
    const latestDate = parseDateKey(latestDateKey)
    const monthOffset =
      (latestDate.getUTCFullYear() - year) * 12 +
      latestDate.getUTCMonth() -
      anchorDate.getUTCMonth()

    return {
      rangeLabel: `Tháng ${String(month).padStart(2, "0")}, ${year}`,
      contextLabel: formatRelativePeriod(period, monthOffset),
      isCurrent: anchorDateKey.slice(0, 7) === latestDateKey.slice(0, 7),
      transactions: transactions.filter((transaction) =>
        transaction.occurredAt.startsWith(monthKey),
      ),
    }
  }

  const startDate = getWeekStart(anchorDate)
  const latestWeekStart = getWeekStart(parseDateKey(latestDateKey))
  const weekOffset = Math.round(
    (latestWeekStart.getTime() - startDate.getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  )

  const endDate = new Date(startDate)
  endDate.setUTCDate(startDate.getUTCDate() + 6)

  const startDateKey = formatDateKey(startDate)
  const endDateKey = formatDateKey(endDate)

  return {
    rangeLabel: formatWeekRange(startDate, endDate),
    contextLabel: formatRelativePeriod(period, weekOffset),
    isCurrent: latestDateKey >= startDateKey && latestDateKey <= endDateKey,
    transactions: transactions.filter((transaction) => {
      const dateKey = transaction.occurredAt.slice(0, 10)

      return dateKey >= startDateKey && dateKey <= endDateKey
    }),
  }
}
