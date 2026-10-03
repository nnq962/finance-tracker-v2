import "server-only"

import { getDb } from "@/lib/db/client"
import { recordRedemption, type Coupon } from "@/lib/plans/coupons"
import { priceWithCoupon, proPrices, type PlanPeriod } from "@/lib/plans/plans"
import { insertGrant } from "@/lib/plans/repository"

export type PaymentStatus = "pending" | "paid" | "cancelled" | "expired"

/** Who grants Pro bought through payOS, in place of an admin's id. */
export const PAYOS_GRANTOR = "payos"

/**
 * Opens a payment for Pro at the period's price, less a coupon's share when
 * one is given; payOS knows it by the order code. The use of the coupon is
 * counted when the payment settles.
 */
export async function createPayment(userId: string, period: PlanPeriod, coupon?: Coupon) {
  const { amount, discount } = coupon
    ? priceWithCoupon(period, coupon.percentOff)
    : { amount: proPrices[period].amount, discount: 0 }
  return getDb()
    .insertInto("payments")
    .values({ userId, period, amount, discount, couponId: coupon?.id ?? null })
    .returning(["id", "orderCode", "amount"])
    .executeTakeFirstOrThrow()
}

/** Keeps payOS's link for the payment, to reopen it rather than make another. */
export async function attachCheckout(orderCode: number, { paymentLinkId, checkoutUrl }: { paymentLinkId: string; checkoutUrl: string }) {
  await getDb()
    .updateTable("payments")
    .set({ paymentLinkId, checkoutUrl })
    .where("orderCode", "=", orderCode)
    .execute()
}

export async function getPayment(orderCode: number) {
  return getDb()
    .selectFrom("payments")
    .select(["userId", "orderCode", "period", "amount", "status", "paidAt"])
    .where("orderCode", "=", orderCode)
    .executeTakeFirst()
}

export type SettleResult = "granted" | "settled" | "underpaid" | "unknown"

/**
 * Settles a payment payOS reports as paid, once: the payment is locked, Pro
 * is granted for its period and both are written together. Reported again
 * (webhook retries, the return page asking too) it is already settled. Less
 * than the price grants nothing and is left for an admin to look at.
 */
export async function settlePaidPayment(
  orderCode: number,
  { amountPaid, reference }: { amountPaid: number; reference?: string },
): Promise<SettleResult> {
  return getDb().transaction().execute(async (trx) => {
    const payment = await trx
      .selectFrom("payments")
      .select(["id", "userId", "period", "amount", "status", "couponId"])
      .where("orderCode", "=", orderCode)
      .forUpdate()
      .executeTakeFirst()
    if (!payment) return "unknown"
    if (payment.status === "paid") return "settled"
    if (amountPaid < payment.amount) {
      console.warn("payOS payment below its price", { orderCode, amountPaid, price: payment.amount })
      return "underpaid"
    }

    const subscriptionId = await insertGrant(trx, payment.userId, {
      period: payment.period as PlanPeriod,
      amount: amountPaid,
      note: `payOS #${orderCode}`,
      grantedBy: PAYOS_GRANTOR,
    })
    // Paid with a code: its use counts now, even past its limit, as the money came in.
    if (payment.couponId) {
      await recordRedemption(trx, { couponId: payment.couponId, userId: payment.userId, subscriptionId })
    }
    // A payment marked cancelled or expired that was paid after all still counts.
    await trx
      .updateTable("payments")
      .set({ status: "paid", paidAt: new Date(), reference: reference ?? null, subscriptionId })
      .where("id", "=", payment.id)
      .execute()
    return "granted"
  })
}

/** Closes a payment that will not be paid, unless it already settled. */
export async function closePayment(orderCode: number, status: "cancelled" | "expired") {
  await getDb()
    .updateTable("payments")
    .set({ status })
    .where("orderCode", "=", orderCode)
    .where("status", "=", "pending")
    .execute()
}
