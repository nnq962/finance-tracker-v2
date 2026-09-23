"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import {
  adjustAccountBalance,
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
  parseBalanceAdjustment,
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
  revalidatePath("/accounts")
  revalidatePath("/transactions")
  revalidatePath("/debts")
  revalidatePath("/overview")
}

export async function createAccountAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireSession()

  try {
    await createAccount(
      user.uid,
      parseAccountFormData(formData, { includeBalance: true }),
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
    await updateAccount(
      user.uid,
      accountId,
      parseAccountFormData(formData, { includeBalance: false }),
    )
    revalidateAccountPaths()
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function adjustAccountBalanceAction(
  accountId: string,
  formData: FormData,
): Promise<AccountActionResult> {
  const user = await requireSession()

  try {
    assertAccountId(accountId)
    await adjustAccountBalance(
      user.uid,
      accountId,
      parseBalanceAdjustment(formData),
    )
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
