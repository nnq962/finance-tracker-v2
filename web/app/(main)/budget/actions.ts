"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { scheduleBudgetAlerts } from "@/lib/budgets/schedule"
import { getDb } from "@/lib/db/client"
import {
  createAccount,
  deleteAccount,
  setAccountArchived,
  updateAccount,
} from "@/lib/accounts/repository"
import type { AccountActionResult } from "@/lib/accounts/types"
import {
  AccountValidationError,
  assertAccountId,
  assertBoolean,
  parseAccountFormData,
  parseExpectedBalance,
} from "@/lib/accounts/validation"

function failure(error: unknown): AccountActionResult {
  if (!(error instanceof AccountValidationError)) {
    console.error("Account action failed", error)
  }

  return {
    success: false,
    error:
      error instanceof AccountValidationError
        ? error.message
        : "Không thể lưu thay đổi. Vui lòng thử lại.",
  }
}

function revalidateAccountPaths() {
  revalidatePath("/budget")
  revalidatePath("/transactions")
  revalidatePath("/overview")
}

export async function createAccountAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireSession()

  try {
    const requestId = formData.get("requestId")
    if (requestId !== null) assertAccountId(String(requestId))
    await createAccount(
      user.uid,
      parseAccountFormData(formData),
      requestId === null ? undefined : String(requestId),
    )
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateAccountAction(
  accountId: string,
  formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireSession()

  try {
    assertAccountId(accountId)
    const values = parseAccountFormData(formData)
    const before = await getDb().selectFrom("accounts").select("excluded").where("id", "=", accountId).where("userId", "=", user.uid).executeTakeFirst()
    await updateAccount(user.uid, accountId, values, parseExpectedBalance(formData))
    // Counted again: its spending may take a limit to its next level.
    if (before?.excluded && !values.excluded) scheduleBudgetAlerts(user.uid)
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function setAccountArchivedAction(
  accountId: string,
  archived: boolean,
): Promise<AccountActionResult> {
  const user = await requireSession()

  try {
    assertAccountId(accountId)
    assertBoolean(archived, "Trạng thái tài khoản")
    await setAccountArchived(user.uid, accountId, archived)
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteAccountAction(
  accountId: string,
): Promise<AccountActionResult> {
  const user = await requireSession()

  try {
    assertAccountId(accountId)
    await deleteAccount(user.uid, accountId)
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}
