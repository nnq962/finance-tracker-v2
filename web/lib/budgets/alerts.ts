import "server-only"

import { daysLeft, hasLimit } from "@/lib/budgets/calculations"
import { budgetPushMessage } from "@/lib/budgets/push-message"
import { getBudgetOverview } from "@/lib/budgets/repository"
import type { BudgetLine } from "@/lib/budgets/types"
import { getDb } from "@/lib/db/client"
import { getFirebaseAdminMessaging } from "@/lib/firebase/admin"
import { PUSH_ICONS } from "@/lib/notifications/types"

type Level = 80 | 90 | 100

export { budgetPushMessage }

/** Where a tap on the push opens: the overview with the limits sheet. */
export const BUDGET_PUSH_URL = "/overview?screen=budgets"

/**
 * The levels a limit has reached this month: the early warning the user
 * chose (80% or 90%; none) once that share is spent, and 100% once past it.
 */
export function reachedLevels(line: BudgetLine & { limit: number }, early: 80 | 90 | null): Level[] {
  const levels: Level[] = []
  if (early !== null && line.spent >= (line.limit * early) / 100) levels.push(early)
  if (line.spent > line.limit) levels.push(100)
  return levels
}

/**
 * Writes down the levels each of this month's limits has reached (the early
 * warning the user chose, and past 100%) and, with `notify`, pushes the ones
 * newly reached (the highest per limit) to the user's linked devices, unless
 * the user turned limit pushes off (then they are written down only, so
 * turning them on later does not push what is past). Each level is pushed once
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
  const rows = lines.flatMap(({ line }) =>
    reachedLevels(line, overview.alerts.level).map((level) => ({ userId, budgetId: line.budgetId, month, level })),
  )
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
  if (notify && overview.alerts.enabled && due.length > 0) await sendBudgetPushes(userId, overview.month, due)
  return due
}

/**
 * To every device still linked to the user's signed-in browsers, as the
 * daily reminder goes. Limit pushes have their own switch (2026-10-17), so
 * the daily reminder's no longer gates them.
 */
async function sendBudgetPushes(
  userId: string,
  month: string,
  pushes: { budgetId: string; level: Level; title: string; body: string }[],
) {
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
