"use server"

import { revalidatePath, updateTag } from "next/cache"

import { MAX_RECORD_ITEMS } from "@/lib/ai/transaction-prompt"
import { requireSession } from "@/lib/auth/session"
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
    await createTransaction(user.uid, parseTransactionFormData(formData), requestId as string | undefined)
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
    await updateTransaction(
      user.uid,
      transactionId,
      parseTransactionFormData(formData),
    )
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

/** This month's AI requests, the plan's limit, and AI credits left. */
export type AiQuota = { used: number; limit: number; credits: number }

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
    // The suggested categories first, one per name and kind however many
    // drafts share it (a name the user already has is used as it is).
    const madeFor = new Map<string, string>()
    for (const draft of drafts) {
      if (draft.kind === "transfer" || draft.categoryId || !draft.newCategory) continue
      const key = `${draft.kind}:${draft.newCategory.name.trim().toLocaleLowerCase("vi-VN")}`
      if (!madeFor.has(key)) {
        const created = await createSuggestedCategory(user.uid, { type: draft.kind, ...draft.newCategory })
        madeFor.set(key, created.itemId)
        if (created.createdItem) made.categoryIds.push(created.itemId)
        if (created.createdGroupId) made.groupIds.push(created.createdGroupId)
      }
      draft.categoryId = madeFor.get(key)
    }
    if (made.categoryIds.length) updateTag(categoryGroupsCacheTag(user.uid))
    const items = drafts.map((draft, index) => {
      const formData = new FormData()
      const fields: Record<string, unknown> = {
        kind: draft.kind,
        amount: draft.amount,
        note: draft.note,
        date: draft.date,
        time: draft.time,
        ...(draft.kind === "transfer"
          ? { fromAccountId: draft.accountId, toAccountId: draft.toAccountId, fee: draft.fee }
          : { accountId: draft.accountId, categoryId: draft.categoryId, excluded: draft.excluded ? "on" : "" }),
      }
      for (const [key, value] of Object.entries(fields)) if (value !== undefined && value !== null) formData.set(key, String(value))
      assertTransactionId(draft.id)
      try {
        return { values: parseTransactionFormData(formData), requestId: draft.id }
      } catch (error) {
        // Says which one, when there are several.
        if (error instanceof TransactionValidationError && drafts.length > 1) {
          throw new TransactionValidationError(`Khoản ${index + 1}: ${error.message}`)
        }
        throw error
      }
    })
    try {
      await createTransactions(user.uid, items)
    } catch (error) {
      // Nothing was written down: what was made for it goes too.
      await takeBackCategories(user.uid, made)
      throw error
    }
    revalidateTransactionPaths()
    return { success: true, ids: items.map((item) => item.requestId), ...made }
  } catch (error) {
    if (error instanceof CategoryValidationError) return { success: false, error: error.message }
    return failure(error) as { success: false; error: string }
  }
}

/** Archives categories (and groups) a save made, once nothing uses them. */
async function takeBackCategories(userId: string, made: Omit<SavedDrafts, "ids">) {
  for (const id of made.categoryIds) await archiveCategoryItem(userId, id).catch(() => undefined)
  for (const id of made.groupIds) await archiveCategoryGroup(userId, id).catch(() => undefined)
  if (made.categoryIds.length || made.groupIds.length) updateTag(categoryGroupsCacheTag(userId))
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
