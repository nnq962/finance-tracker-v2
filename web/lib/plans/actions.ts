"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/plans/admin"
import type { PlanPeriod } from "@/lib/plans/plans"
import { grantPro, listGrants, PlanError, revokePro, type SubscriptionGrant } from "@/lib/plans/repository"
import { MAX_MONEY } from "@/lib/money"

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
