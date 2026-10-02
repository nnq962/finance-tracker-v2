import "server-only"
import { sql } from "kysely"

import { getDb } from "@/lib/db/client"

export type ChecklistState = {
  hidden: boolean
  hasAccount: boolean
  hasTransaction: boolean
  reminderOn: boolean
}

/** Whether the welcome screens still need showing to this user. */
export async function needsOnboarding(userId: string) {
  const user = await getDb()
    .selectFrom("users")
    .select("onboardingSeenAt")
    .where("id", "=", userId)
    .executeTakeFirst()

  return !user?.onboardingSeenAt
}

/** The getting-started steps, read from what the user has already done. */
export async function getChecklistState(userId: string): Promise<ChecklistState> {
  const row = await getDb()
    .selectFrom("users as u")
    .select((eb) => [
      "u.checklistHiddenAt",
      eb.exists(eb.selectFrom("accounts").select(sql.lit(1).as("one")).where("userId", "=", userId)).as("hasAccount"),
      eb.exists(eb.selectFrom("transactions").select(sql.lit(1).as("one")).where("userId", "=", userId)).as("hasTransaction"),
      eb.exists(
        eb.selectFrom("notificationSettings")
          .select(sql.lit(1).as("one"))
          .where("userId", "=", userId)
          .where("notificationsEnabled", "=", true),
      ).as("reminderOn"),
    ])
    .where("u.id", "=", userId)
    .executeTakeFirst()

  return {
    hidden: Boolean(row?.checklistHiddenAt),
    hasAccount: Boolean(row?.hasAccount),
    hasTransaction: Boolean(row?.hasTransaction),
    reminderOn: Boolean(row?.reminderOn),
  }
}

export async function markOnboardingSeen(userId: string) {
  await getDb()
    .updateTable("users")
    .set({ onboardingSeenAt: sql`now()` })
    .where("id", "=", userId)
    .where("onboardingSeenAt", "is", null)
    .execute()
}

export async function hideChecklist(userId: string) {
  await getDb()
    .updateTable("users")
    .set({ checklistHiddenAt: sql`now()` })
    .where("id", "=", userId)
    .execute()
}
