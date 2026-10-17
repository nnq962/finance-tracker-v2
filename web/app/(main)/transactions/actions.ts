"use server"

import { revalidatePath, updateTag } from "next/cache"

import { MAX_RECORD_ITEMS } from "@/lib/ai/transaction-prompt"
import { getDb } from "@/lib/db/client"
import { requireSession } from "@/lib/auth/session"
import { scheduleBudgetAlerts } from "@/lib/budgets/schedule"
import { categoryGroupsCacheTag } from "@/lib/cache-tags"
import { archiveCategoryGroup, archiveCategoryItem } from "@/lib/categories/repository"
import { createSuggestedCategory } from "@/lib/categories/suggested"
import { CategoryValidationError } from "@/lib/categories/validation"
import {
  createTransaction,
  createTransactions,
  deleteTransaction,
  deleteTransactions,
  getDebtPaymentsInRange,
  getTransactionsInRange,
  setTransactionExcluded,
  updateTransaction,
} from "@/lib/transactions/repository"
import type { Transaction, TransactionActionResult } from "@/lib/transactions/types"
import {
  assertTransactionId,
  parseTransactionFormData,
  TransactionValidationError,
} from "@/lib/transactions/validation"


function failure(error: unknown): TransactionActionResult {
  if (!(error instanceof TransactionValidationError)) {
    console.error("Transaction action failed", error)
  }

  return {
    success: false,
    error:
      error instanceof TransactionValidationError
        ? error.message
        : "Không thể lưu giao dịch. Vui lòng thử lại.",
  }
}

function revalidateTransactionPaths() {
  revalidatePath("/transactions")
  revalidatePath("/budget")
  revalidatePath("/overview")
}

export async function createTransactionAction(
  formData: FormData,
): Promise<TransactionActionResult> {
  const user = await requireSession()

  try {
    const requestId = formData.get("requestId") ?? undefined
    if (requestId !== undefined) assertTransactionId(requestId)
    const values = parseTransactionFormData(formData)
    await createTransaction(user.uid, values, requestId as string | undefined)
    // Spending, or a transfer's fee, which the whole month's limit counts.
    if (values.kind !== "income") scheduleBudgetAlerts(user.uid)
    revalidateTransactionPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateTransactionAction(
  transactionId: string,
  formData: FormData,
): Promise<TransactionActionResult> {
  const user = await requireSession()

  try {
    assertTransactionId(transactionId)
    const values = parseTransactionFormData(formData)
    await updateTransaction(user.uid, transactionId, values)
    if (values.kind !== "income") scheduleBudgetAlerts(user.uid)
    revalidateTransactionPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/** Leaves a transaction out of the figures, or counts it again, from its details. */
export async function setTransactionExcludedAction(
  transactionId: string,
  excluded: boolean,
): Promise<TransactionActionResult> {
  const user = await requireSession()

  try {
    assertTransactionId(transactionId)
    await setTransactionExcluded(user.uid, transactionId, excluded === true)
    if (excluded !== true) scheduleBudgetAlerts(user.uid)
    revalidateTransactionPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteTransactionAction(
  transactionId: string,
): Promise<TransactionActionResult> {
  const user = await requireSession()

  try {
    assertTransactionId(transactionId)
    await deleteTransaction(user.uid, transactionId)
    revalidateTransactionPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/**
 * Every transaction the user has, loans' repayments included, newest first:
 * what a search through every month reads. Asked for only from a search that
 * found nothing in the chosen month, or on request, so the page itself still
 * loads one month.
 */
export async function loadAllTransactionsAction(): Promise<Transaction[]> {
  const user = await requireSession()
  const start = new Date(Date.UTC(2000, 0, 1))
  const end = new Date(Date.UTC(2100, 0, 1))
  const [own, repayments] = await Promise.all([
    getTransactionsInRange(user.uid, start, end),
    getDebtPaymentsInRange(user.uid, start, end),
  ])
  return [...own, ...repayments].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
}

/** A transaction the assistant read and the user checked, as the form would send it. */
export type CheckedDraft = {
  id: string
  kind: "expense" | "income" | "transfer"
  amount: number
  accountId: string
  toAccountId?: string
  categoryId?: string
  /** No category fits: the one the assistant suggested, made as it is saved. */
  newCategory?: { name: string; groupId?: string; groupName: string; iconName?: string }
  fee: number
  excluded: boolean
  note: string
  date: string
  time: string
}

/** What a save made besides the transactions, so Hoàn tác takes it back too. */
export type SavedDrafts = { ids: string[]; categoryIds: string[]; groupIds: string[] }

/**
 * Saves the transactions checked in the assistant, all or none, each under
 * its draft's id (saving twice keeps one of each). Every one is read as the
 * form's would be, so the same rules hold.
 */
export async function saveCheckedDraftsAction(
  drafts: CheckedDraft[],
): Promise<({ success: true } & SavedDrafts) | { success: false; error: string }> {
  const user = await requireSession()
  const made: Omit<SavedDrafts, "ids"> = { categoryIds: [], groupIds: [] }

  try {
    if (!Array.isArray(drafts) || drafts.length === 0 || drafts.length > MAX_RECORD_ITEMS) {
      throw new TransactionValidationError("Không có giao dịch hợp lệ để lưu.")
    }
    // Each read as the form's would be, before anything is made: a draft
    // that cannot be saved leaves no category behind. One still to be made
    // stands in under a placeholder id, swapped once it exists.
    const placeholder = "00000000-0000-4000-8000-000000000000"
    const items = drafts.map((draft, index) => {
      if (draft.kind !== "expense" && draft.kind !== "income" && draft.kind !== "transfer") {
        throw new TransactionValidationError("Loại giao dịch không hợp lệ.")
      }
      const pending = draft.kind !== "transfer" && !draft.categoryId && draft.newCategory
      if (pending && (typeof draft.newCategory?.name !== "string" || typeof draft.newCategory.groupName !== "string")) {
        throw new TransactionValidationError("Hạng mục mới không hợp lệ.")
      }
      const formData = new FormData()
      const fields: Record<string, unknown> = {
        kind: draft.kind,
        amount: draft.amount,
        note: draft.note,
        date: draft.date,
        time: draft.time,
        ...(draft.kind === "transfer"
          ? { fromAccountId: draft.accountId, toAccountId: draft.toAccountId, fee: draft.fee }
          : { accountId: draft.accountId, categoryId: pending ? placeholder : draft.categoryId, excluded: draft.excluded ? "on" : "" }),
      }
      for (const [key, value] of Object.entries(fields)) if (value !== undefined && value !== null) formData.set(key, String(value))
      assertTransactionId(draft.id)
      try {
        return { values: parseTransactionFormData(formData), requestId: draft.id, newCategory: pending ? draft.newCategory : undefined }
      } catch (error) {
        // Says which one, when there are several.
        if (error instanceof TransactionValidationError && drafts.length > 1) {
          throw new TransactionValidationError(`Khoản ${index + 1}: ${error.message}`)
        }
        throw error
      }
    })

    // Already saved (a second tap, or the card shown again): nothing more to
    // make or write, and nothing for this save to take back.
    const fresh = await unsavedIds(user.uid, items.map((item) => item.requestId))
    if (fresh.length === 0) return { success: true, ids: items.map((item) => item.requestId), ...made }

    try {
      // The suggested categories, one per name and kind however many drafts
      // share it (a name the user already has is used as it is).
      const madeFor = new Map<string, string>()
      for (const item of items) {
        if (!item.newCategory || item.values.kind === "transfer") continue
        const key = `${item.values.kind}:${item.newCategory.name.trim().toLocaleLowerCase("vi-VN")}`
        if (!madeFor.has(key)) {
          const created = await createSuggestedCategory(user.uid, { type: item.values.kind, ...item.newCategory })
          madeFor.set(key, created.itemId)
          if (created.createdItem) made.categoryIds.push(created.itemId)
          if (created.createdGroupId) made.groupIds.push(created.createdGroupId)
        }
        item.values = { ...item.values, categoryId: madeFor.get(key)! }
      }
      if (made.categoryIds.length) updateTag(categoryGroupsCacheTag(user.uid))
      await createTransactions(user.uid, items)
    } catch (error) {
      // Nothing was written down: what was made for it goes too.
      await takeBackCategories(user.uid, made)
      throw error
    }
    scheduleBudgetAlerts(user.uid)
    revalidateTransactionPaths()
    return { success: true, ids: items.map((item) => item.requestId), ...made }
  } catch (error) {
    if (error instanceof CategoryValidationError) return { success: false, error: error.message }
    return failure(error) as { success: false; error: string }
  }
}

/**
 * Archives categories (and groups) a save made, but only while nothing else
 * uses them: a category no transaction is under, a group with no other
 * active category, both made within the day (the ids come from the client).
 */
async function takeBackCategories(userId: string, made: Omit<SavedDrafts, "ids">) {
  const since = new Date(Date.now() - 86_400_000)
  const unused = made.categoryIds.length
    ? await getDb()
        .selectFrom("categoryItems as ci")
        .select("ci.id")
        .where("ci.userId", "=", userId)
        .where("ci.id", "in", made.categoryIds)
        .where("ci.createdAt", ">", since)
        .where((eb) => eb.not(eb.exists(eb.selectFrom("transactions as t").select("t.id").whereRef("t.categoryItemId", "=", "ci.id"))))
        .execute()
    : []
  for (const { id } of unused) await archiveCategoryItem(userId, id).catch(() => undefined)
  const emptyGroups = made.groupIds.length
    ? await getDb()
        .selectFrom("categoryGroups as cg")
        .select("cg.id")
        .where("cg.userId", "=", userId)
        .where("cg.id", "in", made.groupIds)
        .where("cg.createdAt", ">", since)
        .where((eb) =>
          eb.not(eb.exists(eb.selectFrom("categoryItems as ci").select("ci.id").whereRef("ci.groupId", "=", "cg.id").where("ci.status", "=", "active"))),
        )
        .execute()
    : []
  for (const { id } of emptyGroups) await archiveCategoryGroup(userId, id).catch(() => undefined)
  if (unused.length || emptyGroups.length) updateTag(categoryGroupsCacheTag(userId))
}

/** Which of these transaction ids the user has not saved yet. */
async function unsavedIds(userId: string, ids: string[]) {
  const saved = await getDb().selectFrom("transactions").select("id").where("userId", "=", userId).where("id", "in", ids).execute()
  const have = new Set(saved.map((row) => row.id))
  return ids.filter((id) => !have.has(id))
}

/** Takes back transactions just saved from the assistant, all or none, and the categories made for them. */
export async function undoSavedDraftsAction(saved: SavedDrafts): Promise<TransactionActionResult> {
  const user = await requireSession()

  try {
    const { ids, categoryIds, groupIds } = saved ?? {}
    if (!Array.isArray(ids) || ids.length > MAX_RECORD_ITEMS) throw new TransactionValidationError("Không có giao dịch để hoàn tác.")
    ;[...ids, ...(categoryIds ?? []), ...(groupIds ?? [])].forEach((id) => assertTransactionId(id))
    await deleteTransactions(user.uid, ids)
    await takeBackCategories(user.uid, { categoryIds: categoryIds ?? [], groupIds: groupIds ?? [] })
    revalidateTransactionPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}
