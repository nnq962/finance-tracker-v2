import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"

/**
 * Monthly spending limits ("hạn mức chi tiêu", 2026-10-16): one for the whole
 * month and one per expense category group, repeating every month. What is
 * spent counts only spending with a category (lib/budgets/repository): not
 * transfers, not purchases from a savings jar, nothing left out of the
 * figures, no balance adjustments, no loans or their repayments.
 */

/** A limit and what it is measured against: this month's spending, and the last three months' average. */
export type BudgetLine = {
  /** The limit's id; null while none is set. */
  budgetId: string | null
  limit: number | null
  spent: number
  /** Average spending a month over the last three months that had any, the suggested limit's base. */
  average: number
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
}

export type BudgetActionResult =
  | { success: true }
  | { success: false; error: string }
