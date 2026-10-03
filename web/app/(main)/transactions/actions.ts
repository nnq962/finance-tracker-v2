"use server"

import { revalidatePath } from "next/cache"

import { ollamaJson } from "@/lib/ai/ollama"
import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getCurrentLocalDateTime } from "@/lib/date-time"
import { plans } from "@/lib/plans/plans"
import { releaseAiRequest, reserveAiRequest } from "@/lib/plans/repository"
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

/** This month's AI requests after the one just made, the plan's limit, and AI credits left. */
export type AiQuota = { used: number; limit: number; credits: number }

export type AiTransactionParseResult =
  | { success: true; draft: AiTransactionDraft; quota: AiQuota }
  | { success: false; error: string; quota?: AiQuota }

const MAX_AI_REQUEST_LENGTH = 300

/**
 * Reads a sentence about a transaction with the local model into a draft
 * for the user to check. Nothing is saved. Each request counts against the
 * plan's monthly limit; one the model could not answer is given back.
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

  const reservation = await reserveAiRequest(user.uid)
  const quota = { used: reservation.used, limit: reservation.limit, credits: reservation.credits }
  if (!reservation.allowed) {
    return {
      success: false,
      quota,
      error:
        reservation.limit < plans.pro.aiMonthlyLimit
          ? `Bạn đã dùng hết ${reservation.limit} lượt AI của tháng này. Nâng cấp Pro để có ${plans.pro.aiMonthlyLimit} lượt mỗi tháng.`
          : `Bạn đã dùng hết ${reservation.limit} lượt AI của tháng này.`,
    }
  }

  const [accounts, categoryGroups] = await Promise.all([
    getAccounts(user.uid),
    getCategoryGroups(user.uid),
  ])
  const { date: today, time: now } = getCurrentLocalDateTime()
  const { messages, lists } = buildTransactionPrompt(text, { accounts, categoryGroups, today })

  let reply: unknown
  try {
    reply = await ollamaJson(messages, transactionReplySchema)
  } catch (error) {
    console.error("AI transaction parse failed", error)
    await releaseAiRequest(user.uid, reservation.source)
    return {
      success: false,
      quota:
        reservation.source === "credit"
          ? { ...quota, credits: quota.credits + 1 }
          : { ...quota, used: quota.used - 1 },
      error: "AI đang không phản hồi. Thử lại sau ít phút nhé.",
    }
  }

  const draft = readTransactionReply(reply, { request: text, lists, today, now })
  return draft
    ? { success: true, draft, quota }
    : { success: false, quota, error: "AI chưa hiểu yêu cầu này, thử nói rõ hơn nhé." }
}
