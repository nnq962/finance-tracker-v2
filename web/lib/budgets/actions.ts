"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { syncBudgetAlerts } from "@/lib/budgets/alerts"
import { getBudgetMonth } from "@/lib/budgets/month"
import {
  BudgetValidationError,
  deleteBudget,
  dismissBudgetHint,
  saveBudget,
  saveBudgets,
  setBudgetAlertSettings,
} from "@/lib/budgets/repository"
import type { BudgetActionResult, BudgetAlertSettings, BudgetMonth } from "@/lib/budgets/types"

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

/**
 * Sets several limits at once, the suggestion reviewed ("Đặt theo gợi ý"):
 * all or none. Levels already reached are written down without a push.
 */
export async function saveBudgetsAction(entries: { groupId: string | null; amount: number }[]): Promise<BudgetActionResult> {
  const user = await requireSession()
  try {
    if (!Array.isArray(entries) || entries.length > 100) throw new BudgetValidationError("Hạn mức không hợp lệ.")
    const clean = entries.map((entry) => {
      const groupId = entry?.groupId ?? null
      if (groupId !== null && (typeof groupId !== "string" || !uuidPattern.test(groupId))) {
        throw new BudgetValidationError("Không tìm thấy nhóm hạng mục. Vui lòng tải lại trang.")
      }
      return { groupId, amount: Number(entry?.amount) }
    })
    const ids = await saveBudgets(user.uid, clean)
    await syncBudgetAlerts(user.uid, { notify: false, rearm: ids })
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

/** "Để sau" on the hint to change a limit: hidden for the rest of the month. */
export async function dismissBudgetHintAction(budgetId: string): Promise<BudgetActionResult> {
  const user = await requireSession()
  try {
    if (typeof budgetId !== "string" || !uuidPattern.test(budgetId)) throw new BudgetValidationError("Hạn mức không hợp lệ.")
    await dismissBudgetHint(user.uid, budgetId)
    revalidateBudgetPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/**
 * How limit pushes come: on or off, and the early warning. A new early
 * warning applies from the next spending; levels already passed this month
 * are written down without a push.
 */
export async function saveBudgetAlertSettingsAction(settings: BudgetAlertSettings): Promise<BudgetActionResult> {
  const user = await requireSession()
  try {
    await setBudgetAlertSettings(user.uid, { enabled: settings?.enabled === true, level: settings?.level ?? null })
    await syncBudgetAlerts(user.uid, { notify: false })
    revalidateBudgetPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}
