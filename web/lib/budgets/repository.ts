import "server-only"

import { sql } from "kysely"

import type { BudgetGroupLine, BudgetOverview } from "@/lib/budgets/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import { getDb } from "@/lib/db/client"
import { toDateKey } from "@/lib/format-date"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"
import { MAX_MONEY } from "@/lib/money"

export class BudgetValidationError extends Error {}

/** "YYYY-MM" moved by `by` months. */
function shiftMonth(month: string, by: number) {
  const [year, index] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, index - 1 + by, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/** A month's first moment in Vietnam, as every month in the app is counted. */
function monthStart(month: string) {
  return new Date(`${month}-01T00:00:00+07:00`)
}

const monthOf = sql<string>`to_char(t.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM')`

/**
 * Spending as limits count it, by category group and month, from `from`
 * (a month) to the end of `to`: expenses with a category (so no loans, which
 * carry none, and no balance adjustments), not left out themselves nor by
 * their account, and not paid from a savings jar (that money was set aside
 * for it). Transfers and loan repayments are other kinds or other tables.
 */
async function spendingByGroupAndMonth(userId: string, from: string, to: string) {
  return getDb()
    .selectFrom("transactions as t")
    .innerJoin("accounts as a", "a.id", "t.accountId")
    .innerJoin("categoryItems as c", "c.id", "t.categoryItemId")
    .select(["c.groupId as groupId", monthOf.as("month"), sql<number>`sum(t.amount)`.as("spent")])
    .where("t.userId", "=", userId)
    .where("t.kind", "=", "expense")
    .where("t.adjustment", "=", false)
    .where("t.excluded", "=", false)
    .where("a.excluded", "=", false)
    .where("a.type", "<>", "savings")
    .where("t.occurredAt", ">=", monthStart(from))
    .where("t.occurredAt", "<", monthStart(shiftMonth(to, 1)))
    .groupBy(["c.groupId", monthOf])
    .execute()
}

/**
 * This month's limits for the user: the whole month's and every active
 * spending group's (set or not), each with what is spent so far and the
 * average of the last three months that had spending (fewer for a newer
 * user), rounded to the thousand.
 */
export async function getBudgetOverview(userId: string, today = toDateKey(new Date())): Promise<BudgetOverview> {
  const month = today.slice(0, 7)
  const [year, monthIndex] = month.split("-").map(Number)
  const daysInMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()

  const [groups, budgets, spending] = await Promise.all([
    getDb()
      .selectFrom("categoryGroups")
      .select(["id", "name", "iconName", "colorName"])
      .where("userId", "=", userId)
      .where("type", "=", "expense")
      .where("status", "=", "active")
      .orderBy("sortOrder")
      .orderBy("createdAt")
      .execute(),
    getDb().selectFrom("budgets").select(["id", "categoryGroupId", "amount"]).where("userId", "=", userId).execute(),
    spendingByGroupAndMonth(userId, shiftMonth(month, -3), month),
  ])

  const pastMonths = new Set(spending.filter((row) => row.month < month).map((row) => row.month)).size || 1
  const sums = (groupId?: string) => {
    let spent = 0
    let past = 0
    for (const row of spending) {
      if (groupId && row.groupId !== groupId) continue
      if (row.month === month) spent += row.spent
      else past += row.spent
    }
    return { spent, average: Math.round(past / pastMonths / 1_000) * 1_000 }
  }
  const budgetOf = (groupId: string | null) => budgets.find((budget) => budget.categoryGroupId === groupId)

  const total = budgetOf(null)
  return {
    month,
    day: Number(today.slice(8, 10)),
    daysInMonth,
    total: { budgetId: total?.id ?? null, limit: total?.amount ?? null, ...sums() },
    groups: groups.map((group): BudgetGroupLine => {
      const budget = budgetOf(group.id)
      return {
        groupId: group.id,
        name: group.name,
        iconName: group.iconName as CategoryIconName,
        colorName: group.colorName as CategoryColorName,
        budgetId: budget?.id ?? null,
        limit: budget?.amount ?? null,
        ...sums(group.id),
      }
    }),
  }
}

/**
 * Sets the whole month's limit (`groupId` null) or a spending group's, made
 * or changed. Returns the limit's id.
 */
export async function saveBudget(userId: string, groupId: string | null, amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_MONEY) {
    throw new BudgetValidationError("Hạn mức không hợp lệ.")
  }
  if (groupId) {
    const group = await getDb()
      .selectFrom("categoryGroups")
      .select("id")
      .where("id", "=", groupId)
      .where("userId", "=", userId)
      .where("type", "=", "expense")
      .where("status", "=", "active")
      .executeTakeFirst()
    if (!group) throw new BudgetValidationError("Không tìm thấy nhóm hạng mục. Vui lòng tải lại trang.")
  }

  const saved = await getDb()
    .insertInto("budgets")
    .values({ userId, categoryGroupId: groupId, amount })
    .onConflict((conflict) => conflict.columns(["userId", "categoryGroupId"]).doUpdateSet({ amount }))
    .returning("id")
    .executeTakeFirstOrThrow()
  return saved.id
}

/** Removes a limit; returns what it was, for undoing, or null when it was not the user's. */
export async function deleteBudget(userId: string, budgetId: string) {
  const deleted = await getDb()
    .deleteFrom("budgets")
    .where("id", "=", budgetId)
    .where("userId", "=", userId)
    .returning(["categoryGroupId", "amount"])
    .executeTakeFirst()
  return deleted ?? null
}
