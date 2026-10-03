import "server-only"
import { sql } from "kysely"

import { getDb } from "@/lib/db/client"
import {
  MISSION_REWARD,
  clientMissions,
  isMissionKey,
  type MissionKey,
  type MissionState,
} from "@/lib/onboarding/missions"

/** Whether the welcome screens still need showing to this user. */
export async function needsOnboarding(userId: string) {
  const user = await getDb()
    .selectFrom("users")
    .select("onboardingSeenAt")
    .where("id", "=", userId)
    .executeTakeFirst()

  return !user?.onboardingSeenAt
}

/**
 * Which missions the user's data shows done, the rewards already claimed and
 * the AI credits left. A category counts only when added after the defaults.
 */
export async function getMissionState(userId: string): Promise<MissionState> {
  const exists = (query: ReturnType<typeof sql>) => sql<boolean>`exists (${query})`
  const result = await sql<Record<Exclude<MissionKey, "install">, boolean> & { aiCredits: number | null; claimed: string[] }>`
    SELECT
      ${exists(sql`SELECT 1 FROM accounts WHERE user_id = ${userId}`)} AS account,
      ${exists(sql`SELECT 1 FROM transactions WHERE user_id = ${userId}`)} AS transaction,
      ${exists(sql`SELECT 1 FROM ai_usage WHERE user_id = ${userId} AND count > 0`)} AS ai,
      ${exists(sql`SELECT 1 FROM transactions WHERE user_id = ${userId} AND kind = 'transfer'`)} AS transfer,
      ${exists(sql`SELECT 1 FROM contacts WHERE user_id = ${userId}`)} AS contact,
      ${exists(sql`SELECT 1 FROM debts WHERE user_id = ${userId}`)} AS debt,
      ${exists(sql`
        SELECT 1 FROM category_items ci JOIN users u ON u.id = ci.user_id
        WHERE ci.user_id = ${userId} AND ci.created_at > coalesce(u.categories_initialized_at, '-infinity')
      `)} AS category,
      ${exists(sql`SELECT 1 FROM notification_settings WHERE user_id = ${userId} AND notifications_enabled`)} AS reminder,
      (SELECT ai_credits FROM users WHERE id = ${userId}) AS "aiCredits",
      array(SELECT mission FROM mission_rewards WHERE user_id = ${userId}) AS claimed
  `.execute(getDb())
  const row = result.rows[0]

  return {
    done: {
      account: Boolean(row?.account),
      transaction: Boolean(row?.transaction),
      ai: Boolean(row?.ai),
      transfer: Boolean(row?.transfer),
      contact: Boolean(row?.contact),
      debt: Boolean(row?.debt),
      category: Boolean(row?.category),
      reminder: Boolean(row?.reminder),
      install: false,
    },
    claimed: (row?.claimed ?? []).filter(isMissionKey),
    aiCredits: row?.aiCredits ?? 0,
  }
}

/**
 * Gives a finished mission's reward, once: the claim and the credits go in
 * together, and a second claim adds nothing. Returns the credits now held,
 * or null when the mission is not done or was already claimed.
 */
export async function claimMissionReward(userId: string, mission: MissionKey, doneInBrowser: boolean) {
  const { done } = await getMissionState(userId)
  if (!(clientMissions.includes(mission) ? doneInBrowser : done[mission])) return null

  return getDb().transaction().execute(async (trx) => {
    const claim = await trx
      .insertInto("missionRewards")
      .values({ userId, mission, credits: MISSION_REWARD })
      .onConflict((conflict) => conflict.columns(["userId", "mission"]).doNothing())
      .returning("mission")
      .executeTakeFirst()
    if (!claim) return null

    const user = await trx
      .updateTable("users")
      .set((eb) => ({ aiCredits: eb("aiCredits", "+", MISSION_REWARD) }))
      .where("id", "=", userId)
      .returning("aiCredits")
      .executeTakeFirstOrThrow()
    return user.aiCredits
  })
}

export async function markOnboardingSeen(userId: string) {
  await getDb()
    .updateTable("users")
    .set({ onboardingSeenAt: sql`now()` })
    .where("id", "=", userId)
    .where("onboardingSeenAt", "is", null)
    .execute()
}
