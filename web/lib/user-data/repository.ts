import "server-only"
import { sql } from "kysely"

import { insertDefaultCategories } from "@/lib/categories/repository"
import { getDb } from "@/lib/db/client"

/** How much the user has recorded, shown before wiping it. */
export type UserDataSummary = {
  accounts: number
  transactions: number
  debts: number
  contacts: number
}

export async function getUserDataSummary(userId: string): Promise<UserDataSummary> {
  const count = (table: string) => sql<number>`(SELECT count(*)::int FROM ${sql.table(table)} WHERE user_id = ${userId})`
  const result = await sql<UserDataSummary>`
    SELECT
      ${count("accounts")} AS accounts,
      ${count("transactions")} AS transactions,
      ${count("debts")} AS debts,
      ${count("contacts")} AS contacts
  `.execute(getDb())
  return result.rows[0] ?? { accounts: 0, transactions: 0, debts: 0, contacts: 0 }
}

/**
 * Deletes everything the user has recorded, in one transaction: accounts and
 * jars, transactions, loans with their payments, contacts and categories.
 * What belongs to the sign-in stays (the plan, payments, AI usage and credits,
 * missions claimed, reminders, devices, notices read). The default categories
 * come back and the welcome shows again, as for a new user. Running it twice
 * leaves the same state.
 */
export async function wipeUserData(userId: string) {
  await getDb().transaction().execute(async (trx) => {
    await trx
      .insertInto("users")
      .values({ id: userId })
      .onConflict((conflict) => conflict.column("id").doNothing())
      .execute()
    // Serialises with category changes and a second wipe, which lock it too.
    await trx.selectFrom("users").select("id").where("id", "=", userId).forUpdate().execute()

    // Children first; the references between them are checked at commit.
    await trx.deleteFrom("transactions").where("userId", "=", userId).execute()
    await trx.deleteFrom("debtPayments").where("userId", "=", userId).execute()
    await trx.deleteFrom("debts").where("userId", "=", userId).execute()
    await trx.deleteFrom("debtOperations").where("userId", "=", userId).execute()
    await trx.deleteFrom("contacts").where("userId", "=", userId).execute()
    await trx.deleteFrom("accounts").where("userId", "=", userId).execute()
    await trx.deleteFrom("budgets").where("userId", "=", userId).execute()
    await trx.deleteFrom("categoryItems").where("userId", "=", userId).execute()
    await trx.deleteFrom("categoryGroups").where("userId", "=", userId).execute()

    await insertDefaultCategories(trx, userId)
    await trx
      .updateTable("users")
      // now() is the transaction's start, as the defaults' created_at, so
      // they do not count as categories the user added (missions).
      .set({ categoriesInitializedAt: sql`now()`, onboardingSeenAt: null })
      .where("id", "=", userId)
      .execute()
  })
}
