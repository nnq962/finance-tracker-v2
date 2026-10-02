import { toDateKey } from "@/lib/format-date"
import type { Transaction } from "@/lib/transactions/types"

/**
 * What the overview's calendar and allocation chart need, summed on the
 * server so the page sends totals rather than every transaction; a day's
 * transactions load when the day is opened.
 */

export type DayTotals = {
  income: number
  expense: number
  /** Transactions that day of any kind, transfers included. */
  count: number
}

/** Amount per category group id ("other" when a row has none). */
export type GroupTotals = Record<string, number>

export type MonthAllocation = {
  expense: GroupTotals
  income: GroupTotals
}

/** Per Vietnam day ("YYYY-MM-DD"), counted as the transactions page does. */
export function summarizeDays(transactions: Transaction[]) {
  const days: Record<string, DayTotals> = {}
  for (const transaction of transactions) {
    const key = toDateKey(transaction.occurredAt)
    const day = (days[key] ??= { income: 0, expense: 0, count: 0 })
    if (transaction.kind === "income") day.income += Math.abs(transaction.amount)
    if (transaction.kind === "expense") day.expense += Math.abs(transaction.amount)
    day.count += 1
  }
  return days
}

/** Per month ("YYYY-MM") and category group; loans and transfers left out. */
export function summarizeAllocation(transactions: Transaction[]) {
  const months: Record<string, MonthAllocation> = {}
  for (const transaction of transactions) {
    if (transaction.source || transaction.kind === "transfer") continue
    const month = toDateKey(transaction.occurredAt).slice(0, 7)
    const totals = (months[month] ??= { expense: {}, income: {} })[transaction.kind]
    const key = transaction.categoryGroupId ?? "other"
    totals[key] = (totals[key] ?? 0) + Math.abs(transaction.amount)
  }
  return months
}
