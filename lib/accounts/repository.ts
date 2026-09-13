import "server-only"

import { FieldValue, Timestamp } from "firebase-admin/firestore"

import type {
  Account,
  AccountFormValues,
} from "@/lib/accounts/types"
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin"
import { getInstitution } from "@/lib/institutions"

type AccountDocument = AccountFormValues & {
  status: "active" | "archived"
  createdAt: Timestamp
  updatedAt: Timestamp
}

function getAccountsCollection(userId: string) {
  return getFirebaseAdminFirestore()
    .collection("users")
    .doc(userId)
    .collection("accounts")
}

function getLogoFallback(name: string, institutionName?: string) {
  return (institutionName ?? name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const snapshot = await getAccountsCollection(userId)
    .orderBy("createdAt", "asc")
    .get()

  return snapshot.docs.map((document) => {
    const data = document.data() as AccountDocument
    const institution =
      data.type !== "cash" && data.institutionId
        ? getInstitution(data.type, data.institutionId)
        : undefined
    const institutionName = institution?.shortName ?? institution?.name

    return {
      id: document.id,
      name: data.name,
      type: data.type,
      balance: data.balance,
      institutionId: data.institutionId,
      institutionName,
      note: data.note,
      excludeFromReports: data.excludeFromReports,
      logoUrl: institution?.logoPath,
      logoFallback: getLogoFallback(data.name, institutionName),
      status: data.status,
      updatedAt: data.updatedAt.toDate().toISOString(),
    }
  })
}

export async function createAccount(
  userId: string,
  values: AccountFormValues,
) {
  const now = FieldValue.serverTimestamp()
  const document = {
    name: values.name,
    type: values.type,
    balance: values.balance,
    excludeFromReports: values.excludeFromReports,
    status: "active",
    createdAt: now,
    updatedAt: now,
    ...(values.institutionId
      ? { institutionId: values.institutionId }
      : {}),
    ...(values.note ? { note: values.note } : {}),
  }

  await getAccountsCollection(userId).add(document)
}

export async function updateAccount(
  userId: string,
  accountId: string,
  values: AccountFormValues,
) {
  await getAccountsCollection(userId)
    .doc(accountId)
    .update({
      name: values.name,
      type: values.type,
      institutionId: values.institutionId ?? FieldValue.delete(),
      note: values.note ?? FieldValue.delete(),
      excludeFromReports: values.excludeFromReports,
      updatedAt: FieldValue.serverTimestamp(),
    })
}

export async function setAccountArchived(
  userId: string,
  accountId: string,
  archived: boolean,
) {
  await getAccountsCollection(userId)
    .doc(accountId)
    .update({
      status: archived ? "archived" : "active",
      updatedAt: FieldValue.serverTimestamp(),
    })
}

export async function adjustAccountBalance(
  userId: string,
  accountId: string,
  adjustment: {
    actualBalance: number
    category: string
    note: string
    occurredAt: Date
  },
) {
  const firestore = getFirebaseAdminFirestore()
  const accountReference = getAccountsCollection(userId).doc(accountId)
  const adjustmentReference = accountReference
    .collection("balanceAdjustments")
    .doc()

  await firestore.runTransaction(async (transaction) => {
    const accountSnapshot = await transaction.get(accountReference)

    if (!accountSnapshot.exists) {
      throw new Error("Tài khoản không tồn tại.")
    }

    const previousBalance = accountSnapshot.get("balance")

    if (!Number.isSafeInteger(previousBalance)) {
      throw new Error("Số dư tài khoản hiện tại không hợp lệ.")
    }

    transaction.update(accountReference, {
      balance: adjustment.actualBalance,
      updatedAt: FieldValue.serverTimestamp(),
    })
    transaction.set(adjustmentReference, {
      previousBalance,
      actualBalance: adjustment.actualBalance,
      difference: adjustment.actualBalance - previousBalance,
      category: adjustment.category,
      note: adjustment.note,
      occurredAt: Timestamp.fromDate(adjustment.occurredAt),
      createdAt: FieldValue.serverTimestamp(),
    })
  })
}

export async function deleteAccount(userId: string, accountId: string) {
  await getFirebaseAdminFirestore().recursiveDelete(
    getAccountsCollection(userId).doc(accountId),
  )
}
