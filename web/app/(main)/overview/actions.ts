"use server"

import { requireSession } from "@/lib/auth/session"
import { toDateKey } from "@/lib/format-date"
import { getTransactionsInRange } from "@/lib/transactions/repository"
import type { Transaction } from "@/lib/transactions/types"

type DayTransactionsResult =
  | { success: true; data: Transaction[] }
  | { success: false; error: string }

/** One Vietnam day's transactions, newest first, for the calendar's day
 * sheet; loans are left out, as in the calendar's totals. */
export async function getDayTransactionsAction(dateKey: unknown): Promise<DayTransactionsResult> {
  const user = await requireSession()
  const start = typeof dateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
    ? new Date(`${dateKey}T00:00:00+07:00`)
    : null
  // Rejects malformed keys and impossible dates such as 2026-02-30.
  if (!start || Number.isNaN(start.getTime()) || toDateKey(start) !== dateKey) {
    return { success: false, error: "Ngày không hợp lệ." }
  }

  try {
    const end = new Date(start.getTime() + 86_400_000)
    const transactions = await getTransactionsInRange(user.uid, start, end)
    return { success: true, data: transactions.filter((transaction) => !transaction.source) }
  } catch (error) {
    console.error("Day transactions failed", error)
    return { success: false, error: "Không thể tải giao dịch. Vui lòng thử lại." }
  }
}
