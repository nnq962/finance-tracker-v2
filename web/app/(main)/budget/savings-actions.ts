"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import type { AccountActionResult } from "@/lib/accounts/types"
import { AccountValidationError, assertAccountId } from "@/lib/accounts/validation"
import { assertOpenJar, buyWithJar, createJar, deleteJar, getJarDue, updateJar } from "@/lib/savings/repository"
import { parseJarFormData } from "@/lib/savings/validation"
import { createTransaction } from "@/lib/transactions/repository"
import { parseTransactionFormData, TransactionValidationError } from "@/lib/transactions/validation"

function failure(error: unknown): AccountActionResult {
  const known = error instanceof AccountValidationError || error instanceof TransactionValidationError
  if (!known) console.error("Savings action failed", error)
  return { success: false, error: known ? error.message : "Không thể lưu thay đổi. Vui lòng thử lại." }
}

function revalidateAccountPaths() {
  revalidatePath("/budget")
  revalidatePath("/transactions")
  revalidatePath("/overview")
}

function getRequestId(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "")
  assertAccountId(requestId)
  return requestId
}

export async function createJarAction(formData: FormData): Promise<AccountActionResult> {
  const user = await requireSession()
  try {
    await createJar(user.uid, parseJarFormData(formData), getRequestId(formData))
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateJarAction(jarId: string, formData: FormData): Promise<AccountActionResult> {
  const user = await requireSession()
  try {
    assertAccountId(jarId)
    await updateJar(user.uid, jarId, parseJarFormData(formData, await getJarDue(user.uid, jarId)))
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteJarAction(jarId: string): Promise<AccountActionResult> {
  const user = await requireSession()
  try {
    assertAccountId(jarId)
    await deleteJar(user.uid, jarId)
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/**
 * Money into the jar from an account ("in") or out of it to one ("out"): a
 * transfer between the two, with no fee. The form sends amount, accountId,
 * date, time, note and requestId.
 */
export async function moveJarAction(jarId: string, way: "in" | "out", formData: FormData): Promise<AccountActionResult> {
  const user = await requireSession()
  try {
    assertAccountId(jarId)
    if (way !== "in" && way !== "out") throw new AccountValidationError("Thao tác không hợp lệ.")
    await assertOpenJar(user.uid, jarId)
    const accountId = String(formData.get("accountId") ?? "")
    const transfer = new FormData()
    transfer.set("kind", "transfer")
    transfer.set("amount", String(formData.get("amount") ?? ""))
    transfer.set("fee", "0")
    transfer.set("fromAccountId", way === "in" ? accountId : jarId)
    transfer.set("toAccountId", way === "in" ? jarId : accountId)
    for (const name of ["date", "time", "note"]) transfer.set(name, String(formData.get(name) ?? ""))
    await createTransaction(user.uid, parseTransactionFormData(transfer), getRequestId(formData))
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

/**
 * Bought what the jar was for. The form sends amount (the price),
 * categoryId, date, time, note, otherAccountId (for what is left over or
 * missing) and requestId.
 */
export async function buyWithJarAction(jarId: string, formData: FormData): Promise<AccountActionResult> {
  const user = await requireSession()
  try {
    assertAccountId(jarId)
    const expense = new FormData()
    expense.set("kind", "expense")
    expense.set("accountId", jarId)
    for (const name of ["amount", "categoryId", "date", "time", "note"]) expense.set(name, String(formData.get(name) ?? ""))
    const values = parseTransactionFormData(expense)
    if (values.kind !== "expense") throw new TransactionValidationError("Giao dịch không hợp lệ.")
    const otherAccountId = String(formData.get("otherAccountId") ?? "") || undefined
    if (otherAccountId) assertAccountId(otherAccountId)
    await buyWithJar(user.uid, jarId, values, otherAccountId, getRequestId(formData))
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}
