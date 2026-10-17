import "server-only"

import { sql } from "kysely"

import { monthStart, shiftMonth, spendingByGroupAndMonth } from "@/lib/budgets/repository"
import type { BudgetMonth, BudgetMonthEntry, BudgetMonthGroup, BudgetMonthItem, BudgetMonthLine } from "@/lib/budgets/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import { getDb } from "@/lib/db/client"
import { toDateKey } from "@/lib/format-date"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"

/**
 * Spending as limits count it (see spendingByGroupAndMonth): with a
 * category, in the figures, not paid from a savings jar.
 */
function countedSpending(userId: string, month: string) {
  return getDb()
    .selectFrom("transactions as t")
    .innerJoin("accounts as a", "a.id", "t.accountId")
    .innerJoin("categoryItems as c", "c.id", "t.categoryItemId")
    .where("t.userId", "=", userId)
    .where("t.kind", "=", "expense")
    .where("t.adjustment", "=", false)
    .where("t.excluded", "=", false)
    .where("a.excluded", "=", false)
    .where("a.type", "<>", "savings")
    .where("t.occurredAt", ">=", monthStart(month))
    .where("t.occurredAt", "<", monthStart(shiftMonth(month, 1)))
}

const dayOf = sql<number>`extract(day from t.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int`

/**
 * One month of the user's limits in detail, `month` this one or one gone by
 * (never ahead of `today`): for the whole month and each active spending
 * group, the limit (today's: limits are not kept per month), what was spent,
 * day by day and in each of the six months before; for each group, its
 * categories and its three latest spendings.
 */
export async function getBudgetMonth(userId: string, month: string, today = toDateKey(new Date())): Promise<BudgetMonth> {
  const thisMonth = today.slice(0, 7)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month > thisMonth) month = thisMonth
  const [year, monthIndex] = month.split("-").map(Number)
  const days = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
  const past = month < thisMonth

  const [groups, budgets, months, byDay, recent, first] = await Promise.all([
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
    spendingByGroupAndMonth(userId, shiftMonth(month, -6), month),
    countedSpending(userId, month)
      .select([
        "c.groupId as groupId",
        "c.id as itemId",
        "c.name as itemName",
        "c.iconName as iconName",
        dayOf.as("day"),
        sql<number>`sum(t.amount)`.as("amount"),
        sql<number>`count(*)::int`.as("count"),
      ])
      .groupBy(["c.groupId", "c.id", "c.name", "c.iconName", dayOf])
      .execute(),
    // The three latest in each group.
    getDb()
      .selectFrom(
        countedSpending(userId, month)
          .select([
            "t.id",
            "t.occurredAt",
            "t.amount",
            "c.groupId as groupId",
            "c.name as itemName",
            "c.iconName as iconName",
            "a.name as accountName",
            sql<number>`row_number() over (partition by c.group_id order by t.occurred_at desc, t.id desc)`.as("rank"),
          ])
          .as("ranked"),
      )
      .selectAll()
      .where("rank", "<=", 3)
      .orderBy("occurredAt", "desc")
      .execute(),
    getDb()
      .selectFrom("transactions")
      .select(sql<Date | null>`min(occurred_at)`.as("first"))
      .where("userId", "=", userId)
      .executeTakeFirst(),
  ])

  const monthKeys = Array.from({ length: 7 }, (_, index) => shiftMonth(month, index - 6))
  const line = (groupId: string | null): BudgetMonthLine => {
    const budget = budgets.find((row) => row.categoryGroupId === groupId)
    const history = monthKeys.map((key) =>
      months.filter((row) => row.month === key && (groupId === null || row.groupId === groupId)).reduce((sum, row) => sum + row.spent, 0),
    )
    const daily = Array.from({ length: days }, () => 0)
    for (const row of byDay) if (groupId === null || row.groupId === groupId) daily[row.day - 1] += row.amount
    return { budgetId: budget?.id ?? null, limit: budget?.amount ?? null, spent: history[6], history, daily }
  }

  return {
    month,
    days,
    gone: past ? days : Number(today.slice(8, 10)),
    past,
    minMonth: first?.first ? toDateKey(first.first).slice(0, 7) : month,
    total: line(null),
    groups: groups.map((group): BudgetMonthGroup => {
      const rows = byDay.filter((row) => row.groupId === group.id)
      const items = new Map<string, BudgetMonthItem>()
      for (const row of rows) {
        const item = items.get(row.itemId) ?? { itemId: row.itemId, name: row.itemName, iconName: row.iconName as CategoryIconName, amount: 0, count: 0 }
        item.amount += row.amount
        item.count += row.count
        items.set(row.itemId, item)
      }
      return {
        ...line(group.id),
        groupId: group.id,
        name: group.name,
        iconName: group.iconName as CategoryIconName,
        colorName: group.colorName as CategoryColorName,
        items: [...items.values()].sort((a, b) => b.amount - a.amount),
        recent: recent
          .filter((row) => row.groupId === group.id)
          .map(
            (row): BudgetMonthEntry => ({
              id: row.id,
              occurredAt: new Date(row.occurredAt).toISOString(),
              itemName: row.itemName,
              iconName: row.iconName as CategoryIconName,
              accountName: row.accountName,
              amount: row.amount,
            }),
          ),
        count: rows.reduce((sum, row) => sum + row.count, 0),
      }
    }),
  }
}
