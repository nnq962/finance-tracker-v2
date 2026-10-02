"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
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
