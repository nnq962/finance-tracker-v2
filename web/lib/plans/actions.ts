"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { requireAdmin } from "@/lib/plans/admin"
import {
  createCoupon,
  deleteCoupon,
  findUsableCoupon,
  grantWithCoupon,
  setCouponActive,
  updateCoupon,
  type Coupon,
} from "@/lib/plans/coupons"
import { getDb } from "@/lib/db/client"
import { attachCheckout, createPayment } from "@/lib/plans/payments"
import { getPayOS } from "@/lib/plans/payos"
import { MIN_CHECKOUT_AMOUNT, priceWithCoupon, proPrices, type PlanPeriod } from "@/lib/plans/plans"
import { grantPro, listGrants, PlanError, revokePro, type SubscriptionGrant } from "@/lib/plans/repository"
import { MAX_MONEY } from "@/lib/money"
import { SITE_URL } from "@/lib/site"

export type PlanActionResult = { success: true } | { success: false; error: string }

function failure(error: unknown): { success: false; error: string } {
  if (!(error instanceof PlanError)) console.error("Plan action failed", error)
  return {
    success: false,
    error: error instanceof PlanError ? error.message : "Không thể cập nhật gói. Vui lòng thử lại.",
  }
}

function assertUserId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new PlanError("Người dùng không hợp lệ.")
  }
}

/** Gives a user Pro for a month or a year, after their payment arrived. Admins only. */
export async function grantProAction(
  userId: unknown,
  values: { period: unknown; amount: unknown; note?: unknown },
): Promise<PlanActionResult> {
  const admin = await requireAdmin()

  try {
    assertUserId(userId)
    const period = values.period
    if (period !== "month" && period !== "year") throw new PlanError("Thời hạn không hợp lệ.")
    const amount = values.amount
    if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0 || amount > MAX_MONEY) {
      throw new PlanError("Số tiền không hợp lệ.")
    }
    const note = typeof values.note === "string" ? values.note.trim() : ""
    if (note.length > 200) throw new PlanError("Ghi chú không được vượt quá 200 ký tự.")

    await grantPro(admin.uid, userId, { period: period as PlanPeriod, amount, note })
    revalidatePath("/settings")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/** Ends a user's Pro now. Admins only. */
export async function revokeProAction(userId: unknown): Promise<PlanActionResult> {
  await requireAdmin()

  try {
    assertUserId(userId)
    await revokePro(userId)
    revalidatePath("/settings")
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/** A user's grants, for the admin's view of them. */
export async function getGrantsAction(
  userId: unknown,
): Promise<{ success: true; grants: SubscriptionGrant[] } | { success: false; error: string }> {
  await requireAdmin()

  try {
    assertUserId(userId)
    return { success: true, grants: await listGrants(userId) }
  } catch (error) {
    return failure(error)
  }
}

/**
 * Opens a payOS checkout for Pro: the user pays on payOS's page (a VietQR
 * or their bank app) and comes back to the plan screen, where the payment
 * is checked; the webhook grants Pro the moment the money arrives.
 */
export async function startProCheckoutAction(
  period: unknown,
  from: unknown = "/settings",
  couponCode?: unknown,
): Promise<
  | { success: true; checkoutUrl: string }
  | { success: true; granted: true }
  | { success: false; error: string }
> {
  const user = await requireSession()
  if (period !== "month" && period !== "year") return { success: false, error: "Gói không hợp lệ." }

  // The price comes from the code here, never from the page.
  let coupon: Coupon | undefined
  if (couponCode) {
    try {
      coupon = await findUsableCoupon(getDb(), user.uid, couponCode)
      // Nothing (or next to nothing) left to pay: Pro at once, without payOS.
      if (priceWithCoupon(period, coupon.percentOff).amount < MIN_CHECKOUT_AMOUNT) {
        await grantWithCoupon(user.uid, period, couponCode)
        revalidatePath("/settings")
        revalidatePath("/overview")
        revalidatePath("/transactions")
        return { success: true, granted: true }
      }
    } catch (error) {
      return failure(error)
    }
  }

  const payos = getPayOS()
  if (!payos) {
    return { success: false, error: "Thanh toán tự động chưa được bật. Liên hệ quản trị viên để nâng cấp." }
  }

  try {
    const payment = await createPayment(user.uid, period, coupon)
    // Back to the page the plans were opened over, which opens them again.
    const page = from === "/overview" ? from : "/settings"
    const back = `${SITE_URL}${page}?screen=plan&order=${payment.orderCode}`
    const link = await payos.paymentRequests.create({
      orderCode: payment.orderCode,
      amount: payment.amount,
      // Shown on the transfer; kept short, as some banks allow few characters.
      description: period === "month" ? "FT PRO1T" : "FT PRO12T",
      items: [{ name: `Finance Tracker Pro ${proPrices[period].label}`, quantity: 1, price: payment.amount }],
      returnUrl: back,
      cancelUrl: back,
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
    })
    await attachCheckout(payment.orderCode, { paymentLinkId: link.paymentLinkId, checkoutUrl: link.checkoutUrl })
    return { success: true, checkoutUrl: link.checkoutUrl }
  } catch (error) {
    console.error("payOS checkout failed", error)
    return { success: false, error: "Không tạo được thanh toán. Vui lòng thử lại." }
  }
}

// A user may try a few codes, not guess them: at most this many checks an hour.
const COUPON_CHECKS_PER_HOUR = 10
const couponChecks = new Map<string, number[]>()

/** Whether a code can be used now, and how much it takes off, for the plans to show the new price. */
export async function checkCouponAction(
  code: unknown,
): Promise<{ success: true; code: string; percentOff: number } | { success: false; error: string }> {
  const user = await requireSession()
  const now = Date.now()
  const recent = (couponChecks.get(user.uid) ?? []).filter((time) => now - time < 3_600_000)
  if (recent.length >= COUPON_CHECKS_PER_HOUR) {
    return { success: false, error: "Bạn đã thử quá nhiều mã. Vui lòng thử lại sau." }
  }
  couponChecks.set(user.uid, [...recent, now])

  try {
    const coupon = await findUsableCoupon(getDb(), user.uid, code)
    return { success: true, code: coupon.code, percentOff: coupon.percentOff }
  } catch (error) {
    return failure(error)
  }
}

/** A new code. Admins only. */
export async function createCouponAction(values: {
  code: unknown
  percentOff: unknown
  maxRedemptions?: unknown
  expiresOn?: unknown
}): Promise<PlanActionResult> {
  const admin = await requireAdmin()
  try {
    await createCoupon(admin.uid, values)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

function assertCouponId(couponId: unknown): asserts couponId is string {
  if (typeof couponId !== "string" || !/^[0-9a-f-]{36}$/.test(couponId)) throw new PlanError("Mã giảm giá không hợp lệ.")
}

/** New limits for a code. Admins only. */
export async function updateCouponAction(
  couponId: unknown,
  values: { percentOff: unknown; maxRedemptions?: unknown; expiresOn?: unknown },
): Promise<PlanActionResult> {
  await requireAdmin()
  try {
    assertCouponId(couponId)
    await updateCoupon(couponId, values)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/** Removes a code. Admins only. */
export async function deleteCouponAction(couponId: unknown): Promise<PlanActionResult> {
  await requireAdmin()
  try {
    assertCouponId(couponId)
    await deleteCoupon(couponId)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/** Turns a code on or off. Admins only. */
export async function setCouponActiveAction(couponId: unknown, active: unknown): Promise<PlanActionResult> {
  await requireAdmin()
  try {
    if (typeof couponId !== "string" || !/^[0-9a-f-]{36}$/.test(couponId) || typeof active !== "boolean") {
      throw new PlanError("Mã giảm giá không hợp lệ.")
    }
    await setCouponActive(couponId, active)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}
