import "server-only"

import { sql } from "kysely"

import { shiftMonthKey } from "@/lib/budgets/months"
import { suggestedLimit } from "@/lib/budgets/calculations"
import type { BudgetAdjust, BudgetAlertSettings, BudgetGroupLine, BudgetOverview } from "@/lib/budgets/types"
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

  const [groups, budgets, sixMonths, jars, alerts, first] = await Promise.all([
    getDb()
      .selectFrom("categoryGroups")
      .select(["id", "name", "iconName", "colorName"])
      .where("userId", "=", userId)
      .where("type", "=", "expense")
      .where("status", "=", "active")
      .orderBy("sortOrder")
      .orderBy("createdAt")
      .execute(),
    getDb()
      .selectFrom("budgets")
      .select(["id", "categoryGroupId", "amount", "createdAt", "hintDismissedMonth"])
      .where("userId", "=", userId)
      .execute(),
    // Six months back for the whole month's record of kept months; three for the averages.
    spendingByGroupAndMonth(userId, shiftMonth(month, -6), month),
    spendingByGroupAndMonth(userId, month, month, true),
    getBudgetAlertSettings(userId),
    getDb().selectFrom("transactions").select(sql<Date | null>`min(occurred_at)`.as("first")).where("userId", "=", userId).executeTakeFirst(),
  ])
  const spending = sixMonths.filter((row) => row.month >= shiftMonth(month, -3))
  const fromJars = (groupId?: string) => jars.filter((row) => !groupId || row.groupId === groupId).reduce((sum, row) => sum + row.spent, 0)

  const monthsWithData = new Set(spending.filter((row) => row.month < month).map((row) => row.month)).size
  const pastMonths = monthsWithData || 1
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
  /**
   * The hint to change a limit: set before this month, at least two months
   * of spending to go by, not put off this month, and the average more than
   * 20% over the limit or under half of it.
   */
  const adjustOf = (budget: (typeof budgets)[number] | undefined, average: number): BudgetAdjust | null => {
    if (!budget || monthsWithData < 2) return null
    if (toDateKey(budget.createdAt).slice(0, 7) >= month || budget.hintDismissedMonth === `${month}-01`) return null
    const to = suggestedLimit(average)
    if (!to || to === budget.amount) return null
    if (average > budget.amount * 1.2) return { kind: "low", to }
    if (average < budget.amount * 0.5) return { kind: "high", to }
    return null
  }

  const total = budgetOf(null)
  // The whole month's six months before (oldest first) and this one, read with the page so its
  // lead card says how they went at once, not after the month's detail loads (2026-10-17).
  const history = Array.from({ length: 7 }, (_, index) => shiftMonth(month, index - 6)).map((key) =>
    sixMonths.filter((row) => row.month === key).reduce((sum, row) => sum + row.spent, 0),
  )
  return {
    month,
    day: Number(today.slice(8, 10)),
    daysInMonth,
    total: { budgetId: total?.id ?? null, limit: total?.amount ?? null, ...sums(), fromJars: fromJars(), adjust: adjustOf(total, sums().average) },
    alerts,
    kept: {
      history,
      since: total ? toDateKey(total.createdAt).slice(0, 7) : null,
      minMonth: first?.first ? toDateKey(first.first).slice(0, 7) : month,
    },
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
        adjust: adjustOf(budget, sums(group.id).average),
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

/** How the user wants limit pushes; without a settings row, on at 80%. */
export async function getBudgetAlertSettings(userId: string): Promise<BudgetAlertSettings> {
  const row = await getDb()
    .selectFrom("notificationSettings")
    .select(["budgetAlertsEnabled", "budgetAlertLevel"])
    .where("userId", "=", userId)
    .executeTakeFirst()
  if (!row) return { enabled: true, level: 80 }
  return { enabled: row.budgetAlertsEnabled, level: row.budgetAlertLevel === 90 ? 90 : row.budgetAlertLevel === 80 ? 80 : null }
}

/** Sets how limit pushes come; the rest of the user's notification settings stay. */
export async function setBudgetAlertSettings(userId: string, settings: BudgetAlertSettings) {
  if (typeof settings.enabled !== "boolean" || ![80, 90, null].includes(settings.level)) {
    throw new BudgetValidationError("Cài đặt không hợp lệ.")
  }
  const values = { budgetAlertsEnabled: settings.enabled, budgetAlertLevel: settings.level }
  await getDb()
    .insertInto("notificationSettings")
    .values({ userId, ...values })
    .onConflict((conflict) => conflict.column("userId").doUpdateSet(values))
    .execute()
}

/** "Để sau" on the hint to change a limit: not suggested again this month. */
export async function dismissBudgetHint(userId: string, budgetId: string, today = toDateKey(new Date())) {
  await getDb()
    .updateTable("budgets")
    .set({ hintDismissedMonth: `${today.slice(0, 7)}-01` })
    .where("id", "=", budgetId)
    .where("userId", "=", userId)
    .execute()
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
