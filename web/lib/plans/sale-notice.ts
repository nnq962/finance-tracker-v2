import "server-only"

import { after } from "next/server"

import { getDb } from "@/lib/db/client"
import { getFirebaseAdminAuth, getFirebaseAdminMessaging } from "@/lib/firebase/admin"
import { formatCurrency } from "@/lib/format-currency"
import { adminEmails } from "@/lib/plans/admin"
import { proPrices, type PlanPeriod } from "@/lib/plans/plans"

/**
 * Tells the admins' devices that Pro was just bought, once the response is
 * sent; tapping the notice opens the sale as an income to write down. A
 * failed send is only logged: the sale stands either way.
 */
export function noticeSale(orderCode: number) {
  after(async () => {
    try {
      const payment = await getDb()
        .selectFrom("payments")
        .select(["userId", "period", "amount"])
        .where("orderCode", "=", orderCode)
        .executeTakeFirst()
      const emails = adminEmails()
      if (!payment || emails.length === 0) return

      const auth = getFirebaseAdminAuth()
      const [{ users: admins }, buyer] = await Promise.all([
        auth.getUsers(emails.map((email) => ({ email }))),
        auth.getUser(payment.userId).catch(() => undefined),
      ])
      const adminIds = admins.filter((admin) => admin.emailVerified).map((admin) => admin.uid)
      if (adminIds.length === 0) return
      const devices = await getDb().selectFrom("pushDevices").select("fid").where("userId", "in", adminIds).execute()

      const label = proPrices[payment.period as PlanPeriod]?.label ?? payment.period
      const body = [buyer?.email, `Pro ${label}`, formatCurrency(payment.amount)].filter(Boolean).join(" · ")
      const url = `/transactions?order=${orderCode}`
      const messaging = getFirebaseAdminMessaging()
      await Promise.allSettled(
        devices.map(({ fid }) =>
          messaging.send({
            fid,
            notification: { title: "💰 Có người mua Pro", body },
            data: { type: "sale", url },
            webpush: { notification: { tag: `sale-${orderCode}` } },
          }),
        ),
      )
    } catch (error) {
      console.warn("Sale notice failed", (error as { code?: string }).code ?? (error as Error).name)
    }
  })
}
