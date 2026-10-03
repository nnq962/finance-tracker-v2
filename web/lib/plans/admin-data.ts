import "server-only"

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
