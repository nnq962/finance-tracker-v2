"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { syncBudgetAlerts } from "@/lib/budgets/alerts"
import { getBudgetMonth } from "@/lib/budgets/month"
import { BudgetValidationError, deleteBudget, saveBudget } from "@/lib/budgets/repository"
import type { BudgetActionResult, BudgetMonth } from "@/lib/budgets/types"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function failure(error: unknown): BudgetActionResult {
  if (!(error instanceof BudgetValidationError)) console.error("Budget action failed", error)
  return {
    success: false,
    error: error instanceof BudgetValidationError ? error.message : "Không thể lưu hạn mức. Vui lòng thử lại.",
  }
}

function revalidateBudgetPaths() {
  revalidatePath("/overview")
  revalidatePath("/transactions")
  revalidatePath("/settings")
}

/**
 * Sets the whole month's limit (no group) or a spending group's. The levels
 * it already stands at are written down without a push, so only spending
 * from now on warns.
 */
export async function saveBudgetAction(groupId: string | null, amount: number): Promise<BudgetActionResult> {
  const user = await requireSession()
  try {
    if (groupId !== null && (typeof groupId !== "string" || !uuidPattern.test(groupId))) {
      throw new BudgetValidationError("Không tìm thấy nhóm hạng mục. Vui lòng tải lại trang.")
    }
    const budgetId = await saveBudget(user.uid, groupId, Number(amount))
    await syncBudgetAlerts(user.uid, { notify: false, rearm: budgetId })
    revalidateBudgetPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/** Removes a limit; undone by saving it again (the sheet's toast). */
export async function deleteBudgetAction(budgetId: string): Promise<BudgetActionResult> {
  const user = await requireSession()
  try {
    if (typeof budgetId !== "string" || !uuidPattern.test(budgetId)) throw new BudgetValidationError("Hạn mức không hợp lệ.")
    await deleteBudget(user.uid, budgetId)
    revalidateBudgetPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/** One month of the limits in detail, for the sheet: this month or one gone by. Null when it cannot be read. */
export async function loadBudgetMonthAction(month: string): Promise<BudgetMonth | null> {
  const user = await requireSession()
  try {
    return await getBudgetMonth(user.uid, typeof month === "string" ? month : "")
  } catch (error) {
    console.error("Budget month failed", error)
    return null
  }
}
