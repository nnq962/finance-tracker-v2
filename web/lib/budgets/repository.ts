import "server-only"

import { sql } from "kysely"

import { shiftMonthKey } from "@/lib/budgets/months"
import type { BudgetGroupLine, BudgetOverview } from "@/lib/budgets/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import { getDb } from "@/lib/db/client"
import { toDateKey } from "@/lib/format-date"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"
import { MAX_MONEY } from "@/lib/money"

export class BudgetValidationError extends Error {}

/** "YYYY-MM" moved by `by` months. */
export const shiftMonth = shiftMonthKey

/** A month's first moment in Vietnam, as every month in the app is counted. */
export function monthStart(month: string) {
  return new Date(`${month}-01T00:00:00+07:00`)
}

const monthOf = sql<string>`to_char(t.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM')`

/**
 * Spending as limits count it, by category group and month, from `from`
 * (a month) to the end of `to`: expenses with a category (so no loans, which
 * carry none, and no balance adjustments), not left out themselves nor by
 * their account, and not paid from a savings jar (that money was set aside
 * for it). Transfers and loan repayments are other kinds or other tables.
 * `fromJars`: instead only what was paid from a savings jar, which limits
 * leave out but the other figures count, so the sheet can say so.
 */
export async function spendingByGroupAndMonth(userId: string, from: string, to: string, fromJars = false) {
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
    .where("a.type", fromJars ? "=" : "<>", "savings")
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

  const [groups, budgets, spending, jars] = await Promise.all([
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
    spendingByGroupAndMonth(userId, month, month, true),
  ])
  const fromJars = (groupId?: string) => jars.filter((row) => !groupId || row.groupId === groupId).reduce((sum, row) => sum + row.spent, 0)

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
    total: { budgetId: total?.id ?? null, limit: total?.amount ?? null, ...sums(), fromJars: fromJars() },
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
        fromJars: fromJars(group.id),
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

/**
 * Sets several limits at once ("Đặt theo gợi ý"): all of them or none.
 * Each entry is the whole month's (`groupId` null) or a group's; a group
 * twice, a group that is not one of the user's active spending groups, or an
 * amount out of range refuses the lot. Returns the limits' ids.
 */
export async function saveBudgets(userId: string, entries: { groupId: string | null; amount: number }[]) {
  if (entries.length === 0) throw new BudgetValidationError("Chưa có hạn mức nào để lưu.")
  const keys = entries.map((entry) => entry.groupId ?? "total")
  if (new Set(keys).size !== keys.length) throw new BudgetValidationError("Hạn mức không hợp lệ.")
  for (const entry of entries) {
    if (!Number.isSafeInteger(entry.amount) || entry.amount <= 0 || entry.amount > MAX_MONEY) {
      throw new BudgetValidationError("Hạn mức không hợp lệ.")
    }
  }
  const groupIds = entries.flatMap((entry) => (entry.groupId ? [entry.groupId] : []))
  return getDb().transaction().execute(async (trx) => {
    if (groupIds.length) {
      const found = await trx
        .selectFrom("categoryGroups")
        .select("id")
        .where("id", "in", groupIds)
        .where("userId", "=", userId)
        .where("type", "=", "expense")
        .where("status", "=", "active")
        .execute()
      if (found.length !== groupIds.length) throw new BudgetValidationError("Không tìm thấy nhóm hạng mục. Vui lòng tải lại trang.")
    }
    const ids: string[] = []
    for (const entry of entries) {
      const saved = await trx
        .insertInto("budgets")
        .values({ userId, categoryGroupId: entry.groupId, amount: entry.amount })
        .onConflict((conflict) => conflict.columns(["userId", "categoryGroupId"]).doUpdateSet({ amount: entry.amount }))
        .returning("id")
        .executeTakeFirstOrThrow()
      ids.push(saved.id)
    }
    return ids
  })
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
