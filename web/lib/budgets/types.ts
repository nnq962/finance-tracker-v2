import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"

/**
 * Monthly spending limits ("hạn mức chi tiêu", 2026-10-16): one for the whole
 * month and one per expense category group, repeating every month. What is
 * spent counts only spending with a category (lib/budgets/repository): not
 * transfers, not purchases from a savings jar, nothing left out of the
 * figures, no balance adjustments, no loans or their repayments.
 */

/**
 * A hint to change a limit (2026-10-17): the average of the last months is
 * far over it ("low") or under half of it ("high"); `to` is that average
 * rounded up, as a new limit would be suggested.
 */
export type BudgetAdjust = { kind: "low" | "high"; to: number }

/** How the user wants limit pushes: on or off, and the early warning (80%, 90%, or none: only past 100%). */
export type BudgetAlertSettings = { enabled: boolean; level: 80 | 90 | null }

/** A limit and what it is measured against: this month's spending, and the last three months' average. */
export type BudgetLine = {
  /** The limit's id; null while none is set. */
  budgetId: string | null
  limit: number | null
  spent: number
  /** Average spending a month over the last three months that had any, the suggested limit's base. */
  average: number
  /** This month's spending paid from savings jars: not counted, but the other figures count it. */
  fromJars: number
  /** Whether to suggest changing the limit, unless put off for this month. */
  adjust: BudgetAdjust | null
}

export type BudgetGroupLine = BudgetLine & {
  groupId: string
  name: string
  iconName: CategoryIconName
  colorName: CategoryColorName
}

export type BudgetOverview = {
  /** "YYYY-MM", the month measured (this month). */
  month: string
  /** Today's day of the month, and how many days it has. */
  day: number
  daysInMonth: number
  total: BudgetLine
  /** Every active spending group, in the user's order, with or without a limit. */
  groups: BudgetGroupLine[]
  alerts: BudgetAlertSettings
}

export type BudgetActionResult =
  | { success: true }
  | { success: false; error: string }

/** A category's spending in a month, within its group. */
export type BudgetMonthItem = {
  itemId: string
  name: string
  iconName: CategoryIconName
  amount: number
  count: number
}

/** One of the month's latest spendings in a group. */
export type BudgetMonthEntry = {
  id: string
  /** ISO time. */
  occurredAt: string
  itemName: string
  iconName: CategoryIconName
  accountName: string
  amount: number
}

/** A limit over one month in detail. Past months are measured against today's limit (limits are not kept per month). */
export type BudgetMonthLine = {
  budgetId: string | null
  limit: number | null
  spent: number
  /** Spent in each of the six months before, oldest first, then this one. */
  history: number[]
  /** Spent on each day of the month, the 1st first; days after today are 0. */
  daily: number[]
  /** "YYYY-MM" the limit was set in: months before it had none, so they are not judged. Null without a limit. */
  since: string | null
  /** The month's spending paid from savings jars: not counted, but the other figures count it. */
  fromJars: number
}

export type BudgetMonthGroup = BudgetMonthLine & {
  groupId: string
  name: string
  iconName: CategoryIconName
  colorName: CategoryColorName
  /** By category, largest first. */
  items: BudgetMonthItem[]
  /** The three latest, newest first. */
  recent: BudgetMonthEntry[]
  count: number
}

/** A month of limits in detail: the sheet's month (this one or one gone by) and its detail screens. */
export type BudgetMonth = {
  /** "YYYY-MM". */
  month: string
  days: number
  /** Days gone: up to today in the running month, all of them in a month gone by. */
  gone: number
  past: boolean
  /** The earliest month with any transaction, as far back as the sheet goes. */
  minMonth: string
  total: BudgetMonthLine
  /** Every active spending group, in the user's order. */
  groups: BudgetMonthGroup[]
}
