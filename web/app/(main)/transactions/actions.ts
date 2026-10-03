"use server"

import { revalidatePath } from "next/cache"

import { ollamaJson } from "@/lib/ai/ollama"
import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/transactions/repository"
import type { TransactionActionResult } from "@/lib/transactions/types"
import {
  assertTransactionId,
  parseTransactionFormData,
  TransactionValidationError,
} from "@/lib/transactions/validation"

import type { AiTransactionDraft } from "./_lib/ai-transaction-draft"
import {
  buildTransactionPrompt,
  readTransactionReply,
  transactionReplySchema,
} from "./_lib/ai-transaction-prompt"
import { getTransactionDateKey } from "./_lib/get-transaction-period"

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

export type AiTransactionParseResult =
  | { success: true; draft: AiTransactionDraft }
  | { success: false; error: string }

const MAX_AI_REQUEST_LENGTH = 300

/**
 * Reads a sentence about a transaction with the local model into a draft
 * for the user to check. Nothing is saved.
 */
export async function parseTransactionWithAiAction(
  request: string,
): Promise<AiTransactionParseResult> {
  const user = await requireSession()
  const text = typeof request === "string" ? request.trim() : ""
  if (!text) return { success: false, error: "Hãy nói hoặc gõ một khoản thu chi." }
  if (text.length > MAX_AI_REQUEST_LENGTH) {
    return { success: false, error: "Câu dài quá, hãy nói gọn một khoản thôi nhé." }
  }

  const [accounts, categoryGroups] = await Promise.all([
    getAccounts(user.uid),
    getCategoryGroups(user.uid),
  ])
  const today = getTransactionDateKey(new Date())
  const { messages, lists } = buildTransactionPrompt(text, { accounts, categoryGroups, today })

  let reply: unknown
  try {
    reply = await ollamaJson(messages, transactionReplySchema)
  } catch (error) {
    console.error("AI transaction parse failed", error)
    return { success: false, error: "AI đang không phản hồi. Thử lại sau ít phút nhé." }
  }

  const draft = readTransactionReply(reply, lists, today)
  return draft
    ? { success: true, draft }
    : { success: false, error: "AI chưa hiểu yêu cầu này, thử nói rõ hơn nhé." }
}
