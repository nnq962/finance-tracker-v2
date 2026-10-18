import "server-only"

import { after } from "next/server"

import { getDb } from "@/lib/db/client"
import { getFirebaseAdminAuth, getFirebaseAdminMessaging } from "@/lib/firebase/admin"
import { formatCurrency } from "@/lib/format-currency"
import { noticeSaleToOps } from "@/lib/ops/events"
import { PUSH_ICONS } from "@/lib/notifications/types"
import { adminEmails } from "@/lib/plans/admin"
import { proPrices, type PlanPeriod } from "@/lib/plans/plans"

/**
 * Runs `task` once the response is sent, or at once in the background when
 * there is no request to wait for (a script or test settling a payment):
 * Next's `after` throws there, which failed the payOS webhook after the sale
 * was already saved.
 */
function afterResponse(task: () => Promise<void>) {
  try {
    after(task)
  } catch {
    void task()
  }
}

/**
 * Tells the admins' devices that Pro was just bought, once the response is
 * sent; tapping the notice opens the sale as an income to write down. A
 * failed send is only logged: the sale stands either way.
 */
export function noticeSale(orderCode: number) {
  afterResponse(async () => {
    try {
      const payment = await getDb()
        .selectFrom("payments")
        .leftJoin("subscriptions", "subscriptions.id", "payments.subscriptionId")
        .select(["payments.userId", "payments.period", "payments.amount", "payments.discount", "subscriptions.amount as received"])
        .where("payments.orderCode", "=", orderCode)
        .executeTakeFirst()
      if (!payment) return
      const auth = getFirebaseAdminAuth()
      const buyer = await auth.getUser(payment.userId).catch(() => undefined)
      // The admin's Telegram as well as their devices (2026-10-18), with what
      // payOS says came in, as the takings count it.
      noticeSaleToOps({
        email: buyer?.email,
        period: payment.period,
        amount: payment.received ?? payment.amount,
        discount: payment.discount,
      })

      const emails = adminEmails()
      if (emails.length === 0) return
      const { users: admins } = await auth.getUsers(emails.map((email) => ({ email })))
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
            webpush: { notification: { tag: `sale-${orderCode}`, ...PUSH_ICONS } },
          }),
        ),
      )
    } catch (error) {
      console.warn("Sale notice failed", (error as { code?: string }).code ?? (error as Error).name)
    }
  })
}
