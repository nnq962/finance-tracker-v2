import { toDateKey } from "@/lib/format-date"
import { isLeftOut, withFees, type Transaction } from "@/lib/transactions/types"

/**
 * What the overview's calendar and allocation chart need, summed on the
 * server so the page sends totals rather than every transaction; a day's
 * transactions load when the day is opened.
 */

export type DayTotals = {
  income: number
  expense: number
  /** Transactions that day of any kind, transfers included, loans not. */
  count: number
}

/** Amount per category group id ("other" when a row has none). */
export type GroupTotals = Record<string, number>

export type MonthAllocation = {
  expense: GroupTotals
  income: GroupTotals
}

/**
 * Per Vietnam day ("YYYY-MM-DD"). Loans are left out, as in the allocation
 * chart and the six-month chart: borrowing and lending are not income or
 * spending; so are transactions the user left out of the figures.
 */
export function summarizeDays(transactions: Transaction[]) {
  const days: Record<string, DayTotals> = {}
  for (const transaction of withFees(transactions)) {
    if (transaction.source) continue
    const key = toDateKey(transaction.occurredAt)
    const day = (days[key] ??= { income: 0, expense: 0, count: 0 })
    // Still a transaction that day, but left out of its sums.
    if (!isLeftOut(transaction)) {
      if (transaction.kind === "income") day.income += Math.abs(transaction.amount)
      if (transaction.kind === "expense") day.expense += Math.abs(transaction.amount)
    }
    // A fee is part of its transfer, counted once.
    if (!transaction.isFee) day.count += 1
  }
  return days
}

/** Per month ("YYYY-MM") and category group; loans and transfers left out, their fees in a group of their own. */
export function summarizeAllocation(transactions: Transaction[]) {
  const months: Record<string, MonthAllocation> = {}
  for (const transaction of withFees(transactions)) {
    if (transaction.source || transaction.kind === "transfer" || isLeftOut(transaction)) continue
    const month = toDateKey(transaction.occurredAt).slice(0, 7)
    const totals = (months[month] ??= { expense: {}, income: {} })[transaction.kind]
    const key = transaction.categoryGroupId ?? "other"
    totals[key] = (totals[key] ?? 0) + Math.abs(transaction.amount)
  }
  return months
}
