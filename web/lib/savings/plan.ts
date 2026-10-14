import type { Account } from "@/lib/accounts/types"
import { formatCompactCurrency } from "@/lib/format-currency"

/** Suggested amounts are rounded up to this, so they read as a plan (6tr, not 5.983.000đ). */
const ROUND_TO = 100_000

/** "YYYY-MM" of a date key or of today in Vietnam time. */
function monthOf(dateKey: string) {
  return dateKey.slice(0, 7)
}

/**
 * Months left to put money aside, this one included: due in December seen
 * in October is 3 (October, November, December), as there is still this
 * month's saving to do. At least one, also once the month has passed.
 */
export function monthsLeft(due: string, today: string) {
  const [dueYear, dueMonth] = monthOf(due).split("-").map(Number)
  const [year, month] = monthOf(today).split("-").map(Number)
  return Math.max(1, (dueYear - year) * 12 + (dueMonth - month) + 1)
}

/** How much a jar still needs: none once its balance reaches the target. */
export function amountLeft(jar: Pick<Account, "balance" | "goal">) {
  return Math.max((jar.goal?.target ?? 0) - jar.balance, 0)
}

/** What to put in each month to reach the target by the due month, rounded up to 100.000đ but never past what is left. */
export function monthlyAmount(jar: Pick<Account, "balance" | "goal">, today: string) {
  const left = amountLeft(jar)
  if (!jar.goal?.due || left === 0) return null
  return Math.min(Math.ceil(left / monthsLeft(jar.goal.due, today) / ROUND_TO) * ROUND_TO, left)
}

/** The share saved, 0 to 1. */
export function savedShare(jar: Pick<Account, "balance" | "goal">) {
  const target = jar.goal?.target ?? 0
  return target > 0 ? Math.min(Math.max(jar.balance / target, 0), 1) : 0
}

/** A jar's line under its name: "Còn 3 tháng · 6tr/tháng", "Còn thiếu 12tr", or "Đủ tiền rồi". */
export function jarPlanLabel(jar: Pick<Account, "balance" | "goal">, today: string) {
  const left = amountLeft(jar)
  if (left === 0) return "Đủ tiền rồi"
  const monthly = monthlyAmount(jar, today)
  if (!jar.goal?.due || monthly === null) return `Còn thiếu ${formatCompactCurrency(left, 1)}`
  return `Còn ${monthsLeft(jar.goal.due, today)} tháng · ${formatCompactCurrency(monthly, 1)}/tháng`
}

/** "12/2026" for a due day. */
export function formatDueMonth(due: string) {
  const [year, month] = due.split("-")
  return `${month}/${year}`
}

/** The last day of a "YYYY-MM" month, as the due day stored. */
export function lastDayOfMonth(month: string) {
  const [year, value] = month.split("-").map(Number)
  return new Date(Date.UTC(year, value, 0)).toISOString().slice(0, 10)
}
