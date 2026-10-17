import "server-only"

import { budgetPercent, daysLeft, hasLimit, perDay } from "@/lib/budgets/calculations"
import { getBudgetOverview } from "@/lib/budgets/repository"
import type { BudgetLine } from "@/lib/budgets/types"
import { getDb } from "@/lib/db/client"
import { getFirebaseAdminMessaging } from "@/lib/firebase/admin"
import { formatCurrency } from "@/lib/format-currency"
import { PUSH_ICONS } from "@/lib/notifications/types"

type Level = 80 | 100

/** Where a tap on the push opens: the overview with the limits sheet. */
export const BUDGET_PUSH_URL = "/overview?screen=budgets"

/** The levels a limit has reached this month: 80% from four fifths, 100% once past it. */
function reachedLevels(line: BudgetLine & { limit: number }): Level[] {
  if (line.spent > line.limit) return [80, 100]
  if (line.spent >= line.limit * 0.8) return [80]
  return []
}

/** The push for a limit at a level: past it, how far; near it, what is left a day. */
export function budgetPushMessage(
  name: string | null,
  line: BudgetLine & { limit: number },
  level: Level,
  days: number,
) {
  if (level === 100) {
    return {
      title: name ? `Vượt hạn mức ${name}` : "Vượt hạn mức tổng",
      body: `Đã chi ${formatCurrency(line.spent)}, vượt ${formatCurrency(line.spent - line.limit)}.`,
    }
  }
  const percent = Math.min(budgetPercent(line.spent, line.limit), 100)
  const left = line.limit - line.spent
  return {
    title: name ? `${name} đã dùng ${percent}% hạn mức` : `Đã dùng ${percent}% hạn mức tổng`,
    body:
      left > 0
        ? `Còn ${formatCurrency(left)} cho ${days} ngày, khoảng ${formatCurrency(perDay(line.spent, line.limit, days))} mỗi ngày.`
        : "Đã dùng hết hạn mức tháng này.",
  }
}

/**
 * Writes down the levels each of this month's limits has reached and, with
 * `notify`, pushes the ones newly reached (the highest per limit) to the
 * user's linked devices when notifications are on. Each level is pushed once
 * a month; `rearm` (a limit just saved) first forgets that limit's levels, so
 * a raised limit warns again, while whatever it already reached is written
 * down without a push. Returns the pushes due, sent or not.
 */
export async function syncBudgetAlerts(userId: string, { notify, rearm }: { notify: boolean; rearm?: string | string[] }) {
  const overview = await getBudgetOverview(userId)
  const month = `${overview.month}-01`
  const rearmed = rearm === undefined ? [] : Array.isArray(rearm) ? rearm : [rearm]
  if (rearmed.length) {
    await getDb().deleteFrom("budgetAlerts").where("budgetId", "in", rearmed).where("userId", "=", userId).where("month", "=", month).execute()
  }

  const lines = [
    { name: null, line: overview.total },
    ...overview.groups.map((group) => ({ name: group.name, line: group as BudgetLine })),
  ].flatMap(({ name, line }) => (hasLimit(line) ? [{ name, line }] : []))
  const rows = lines.flatMap(({ line }) => reachedLevels(line).map((level) => ({ userId, budgetId: line.budgetId, month, level })))
  if (rows.length === 0) return []

  const inserted = await getDb()
    .insertInto("budgetAlerts")
    .values(rows)
    .onConflict((conflict) => conflict.columns(["budgetId", "month", "level"]).doNothing())
    .returning(["budgetId", "level"])
    .execute()

  const due = lines.flatMap(({ name, line }) => {
    const levels = inserted.filter((row) => row.budgetId === line.budgetId).map((row) => row.level as Level)
    if (levels.length === 0) return []
    return [{ budgetId: line.budgetId, level: Math.max(...levels) as Level, ...budgetPushMessage(name, line, Math.max(...levels) as Level, daysLeft(overview)) }]
  })
  if (notify && due.length > 0) await sendBudgetPushes(userId, overview.month, due)
  return due
}

/** To every device still linked to the user's signed-in browsers, as the daily reminder goes; only when notifications are on. */
async function sendBudgetPushes(
  userId: string,
  month: string,
  pushes: { budgetId: string; level: Level; title: string; body: string }[],
) {
  const settings = await getDb()
    .selectFrom("notificationSettings")
    .select("notificationsEnabled")
    .where("userId", "=", userId)
    .executeTakeFirst()
  if (!settings?.notificationsEnabled) return

  const devices = await getDb()
    .selectFrom("pushDevices as d")
    .innerJoin("notificationBrowsers as b", "b.id", "d.browserId")
    .select("d.fid")
    .where("d.userId", "=", userId)
    .where("b.userId", "=", userId)
    .whereRef("b.deviceId", "=", "d.id")
    .execute()

  for (const push of pushes) {
    for (const device of devices) {
      try {
        await getFirebaseAdminMessaging().send({
          fid: device.fid,
          notification: { title: push.title, body: push.body },
          data: { type: "budget", url: BUDGET_PUSH_URL },
          webpush: {
            headers: { TTL: "3600" },
            notification: { tag: `budget-${push.budgetId}-${month}-${push.level}`, ...PUSH_ICONS },
          },
        })
      } catch (error) {
        // Avoid logging FIDs or payloads.
        console.warn("Budget push failed", (error as { code?: string }).code ?? (error as Error).name)
      }
    }
  }
}
