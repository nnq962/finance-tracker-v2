"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { requireAdmin } from "@/lib/plans/admin"
import { attachCheckout, createPayment } from "@/lib/plans/payments"
import { getPayOS } from "@/lib/plans/payos"
import { proPrices, type PlanPeriod } from "@/lib/plans/plans"
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
): Promise<{ success: true; checkoutUrl: string } | { success: false; error: string }> {
  const user = await requireSession()
  if (period !== "month" && period !== "year") return { success: false, error: "Gói không hợp lệ." }
  const payos = getPayOS()
  if (!payos) {
    return { success: false, error: "Thanh toán tự động chưa được bật. Liên hệ quản trị viên để nâng cấp." }
  }

  try {
    const payment = await createPayment(user.uid, period)
    // Back to the plans in settings: the sheet on a phone, the dialog on wider screens.
    const back = `${SITE_URL}/settings?screen=plan&order=${payment.orderCode}`
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
