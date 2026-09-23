"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/auth/session"
import { createContact, updateContact, deleteContact, createDebt, saveDebtPayment, changeDebt } from "@/lib/debts/repository"
import { DebtValidationError } from "@/lib/debts/validation"

async function mutate<T>(operation: (uid: string) => Promise<T>) {
  const user = await requireSession()
  try {
    const data = await operation(user.uid)
    for (const path of ["/debts", "/accounts", "/transactions", "/overview"]) revalidatePath(path)
    return { success: true as const, data }
  } catch (error) {
    if (!(error instanceof DebtValidationError)) console.error("Debt operation failed", error)
    return { success: false as const, error: error instanceof DebtValidationError ? error.message : "Không thể lưu thay đổi. Vui lòng thử lại." }
  }
}

export async function createContactAction(input: unknown, operationId: string) {
  return mutate((uid) => createContact(uid, input, operationId))
}
export async function updateContactAction(id: string, input: unknown) {
  return mutate((uid) => updateContact(uid, id, input))
}
export async function deleteContactAction(id: string) {
  return mutate((uid) => deleteContact(uid, id))
}
export async function createDebtAction(input: unknown, operationId: string) {
  return mutate((uid) => createDebt(uid, input, operationId))
}
export async function saveDebtPaymentAction(debtId: string, paymentId: string | undefined, input: unknown | null, operationId: string) {
  return mutate((uid) => saveDebtPayment(uid, debtId, paymentId, input, operationId))
}

export async function changeDebtAction(debtId: string, input: unknown | null, operationId: string) {
  return mutate((uid) => changeDebt(uid, debtId, input, operationId))
}
