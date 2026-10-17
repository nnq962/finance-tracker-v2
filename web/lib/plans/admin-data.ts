import "server-only"

import { sql } from "kysely"

import { getDb } from "@/lib/db/client"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"
import { listCouponsForAdmin, type AdminCoupon } from "@/lib/plans/coupons"
import { getMonthTakings, listUsersForAdmin } from "@/lib/plans/repository"

export type AdminUser = {
  id: string
  email: string
  name: string
  createdAt: string
  proEndsAt?: string
  aiUsed: number
}

export type AdminData = {
  users: AdminUser[]
  takings: { total: number; count: number }
  coupons: AdminCoupon[]
}

/**
 * Every user for the admin screen. Names and addresses come from Firebase
 * Auth, which keeps them, rather than a copy in the database.
 */
export async function getAdminData(): Promise<AdminData> {
  const [rows, takings, coupons] = await Promise.all([listUsersForAdmin(), getMonthTakings(), listCouponsForAdmin()])
  const auth = getFirebaseAdminAuth()
  const profiles = new Map<string, { email: string; name: string }>()
  // Firebase looks up at most 100 users per call.
  for (let index = 0; index < rows.length; index += 100) {
    const { users } = await auth.getUsers(rows.slice(index, index + 100).map(({ id }) => ({ uid: id })))
    for (const user of users) {
      profiles.set(user.uid, { email: user.email ?? "", name: user.displayName ?? "" })
    }
  }
  return {
    users: rows.map((row) => ({ ...row, ...(profiles.get(row.id) ?? { email: "", name: "" }) })),
    takings,
    coupons,
  }
}

/**
 * What the settings list says about the admin's screens, cheap to read on
 * every visit: how many users there are and how many broadcasts wait to go
 * out. The screens themselves load their data when opened (2026-10-17: the
 * whole of it, Firebase lookups included, came with every settings page).
 */
export async function getAdminSummary(): Promise<{ users: number; scheduled: number }> {
  const db = getDb()
  const [users, scheduled] = await Promise.all([
    db.selectFrom("users").select(sql<number>`count(*)::int`.as("n")).executeTakeFirstOrThrow(),
    db
      .selectFrom("broadcasts")
      .select(sql<number>`count(*)::int`.as("n"))
      .where("status", "=", "scheduled")
      .where("revokedAt", "is", null)
      .executeTakeFirstOrThrow(),
  ])
  return { users: users.n, scheduled: scheduled.n }
}
