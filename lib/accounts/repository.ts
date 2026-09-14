import "server-only"

import { FieldValue, Timestamp } from "firebase-admin/firestore"

import type {
  Account,
  AccountFormValues,
} from "@/lib/accounts/types"
import { AccountValidationError } from "@/lib/accounts/validation"
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin"
import { getInstitution } from "@/lib/institutions"

type AccountDocument = AccountFormValues & {
  openingBalance?: number
  status: "active" | "archived"
  createdAt: Timestamp
  updatedAt: Timestamp
}

type CategoryItemDocument = {
  groupId: string
  name: string
  status: "active" | "archived"
  type: "expense" | "income"
}

type CategoryGroupDocument = {
  name: string
  status: "active" | "archived"
  type: "expense" | "income"
}

function getUserReference(userId: string) {
  return getFirebaseAdminFirestore().collection("users").doc(userId)
}

function getAccountsCollection(userId: string) {
  return getUserReference(userId).collection("accounts")
}

function getCategoryItemsCollection(userId: string) {
  return getUserReference(userId).collection("categoryItems")
}

function getCategoryGroupsCollection(userId: string) {
  return getUserReference(userId).collection("categoryGroups")
}

function addTransactionImpact(
  impacts: Map<string, number>,
  accountId: unknown,
  delta: number,
) {
  if (typeof accountId !== "string" || !Number.isSafeInteger(delta)) return
  impacts.set(accountId, (impacts.get(accountId) ?? 0) + delta)
}

async function backfillOpeningBalances(
  userId: string,
  documents: FirebaseFirestore.QueryDocumentSnapshot[],
) {
  const missingDocuments = documents.filter((document) =>
    !Number.isSafeInteger(document.get("openingBalance")),
  )

  if (missingDocuments.length === 0) return new Map<string, number>()

  const firestore = getFirebaseAdminFirestore()
  const transactionSnapshot = await firestore
    .collection("users")
    .doc(userId)
    .collection("transactions")
    .get()
  const transactionImpacts = new Map<string, number>()

  transactionSnapshot.docs.forEach((document) => {
    const kind = document.get("kind")
    const amount = document.get("amount")
    const fee = document.get("fee") ?? 0

    if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(fee)) return

    if (kind === "expense") {
      addTransactionImpact(
        transactionImpacts,
        document.get("accountId"),
        -amount,
      )
    } else if (kind === "income") {
      addTransactionImpact(
        transactionImpacts,
        document.get("accountId"),
        amount,
      )
    } else if (kind === "transfer") {
      addTransactionImpact(
        transactionImpacts,
        document.get("fromAccountId"),
        -(amount + fee),
      )
      addTransactionImpact(
        transactionImpacts,
        document.get("toAccountId"),
        amount,
      )
    }
  })

  const adjustmentSnapshots = await Promise.all(
    missingDocuments.map((document) =>
      document.ref.collection("balanceAdjustments").get(),
    ),
  )
  const openingBalances = new Map<string, number>()
  const updates: Promise<FirebaseFirestore.WriteResult>[] = []

  missingDocuments.forEach((document, index) => {
    const currentBalance = document.get("balance")
    const adjustmentImpact = adjustmentSnapshots[index].docs.reduce(
      (total, adjustment) => {
        const difference = adjustment.get("difference")
        return Number.isSafeInteger(difference) ? total + difference : total
      },
      0,
    )
    const inferredOpeningBalance =
      currentBalance -
      (transactionImpacts.get(document.id) ?? 0) -
      adjustmentImpact
    const openingBalance =
      Number.isSafeInteger(inferredOpeningBalance) &&
      inferredOpeningBalance >= 0 &&
      inferredOpeningBalance <= 999_999_999_999_999
        ? inferredOpeningBalance
        : currentBalance

    openingBalances.set(document.id, openingBalance)
    updates.push(document.ref.update({ openingBalance }))
  })

  await Promise.all(updates)
  return openingBalances
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
  const backfilledOpeningBalances = await backfillOpeningBalances(
    userId,
    snapshot.docs,
  )

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
      openingBalance:
        data.openingBalance ??
        backfilledOpeningBalances.get(document.id) ??
        data.balance,
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
    openingBalance: values.balance,
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
    categoryId: string
    note: string
    occurredAt: Date
  },
) {
  const firestore = getFirebaseAdminFirestore()
  const accountReference = getAccountsCollection(userId).doc(accountId)
  const categoryReference = getCategoryItemsCollection(userId).doc(
    adjustment.categoryId,
  )
  const adjustmentReference = accountReference
    .collection("balanceAdjustments")
    .doc()

  await firestore.runTransaction(async (transaction) => {
    const [accountSnapshot, categorySnapshot] = await transaction.getAll(
      accountReference,
      categoryReference,
    )

    if (!accountSnapshot.exists) {
      throw new Error("Tài khoản không tồn tại.")
    }

    const previousBalance = accountSnapshot.get("balance")

    if (!Number.isSafeInteger(previousBalance)) {
      throw new Error("Số dư tài khoản hiện tại không hợp lệ.")
    }

    const difference = adjustment.actualBalance - previousBalance

    if (difference === 0) {
      throw new AccountValidationError(
        "Số dư thực tế không có thay đổi.",
      )
    }

    const expectedCategoryType = difference > 0 ? "income" : "expense"
    const expectedCategoryLabel = difference > 0 ? "thu" : "chi"

    if (
      !categorySnapshot.exists ||
      categorySnapshot.get("status") !== "active" ||
      categorySnapshot.get("type") !== expectedCategoryType
    ) {
      throw new AccountValidationError(
        `Hạng mục ${expectedCategoryLabel} không tồn tại, đã ngừng sử dụng hoặc không phù hợp với chênh lệch số dư.`,
      )
    }

    const category = categorySnapshot.data() as CategoryItemDocument
    const categoryGroupSnapshot = await transaction.get(
      getCategoryGroupsCollection(userId).doc(category.groupId),
    )

    if (
      !categoryGroupSnapshot.exists ||
      categoryGroupSnapshot.get("status") !== "active" ||
      categoryGroupSnapshot.get("type") !== expectedCategoryType
    ) {
      throw new AccountValidationError(
        `Nhóm hạng mục ${expectedCategoryLabel} không tồn tại, đã ngừng sử dụng hoặc không phù hợp với chênh lệch số dư.`,
      )
    }

    const categoryGroup =
      categoryGroupSnapshot.data() as CategoryGroupDocument

    transaction.update(accountReference, {
      balance: adjustment.actualBalance,
      updatedAt: FieldValue.serverTimestamp(),
    })
    transaction.set(adjustmentReference, {
      previousBalance,
      actualBalance: adjustment.actualBalance,
      difference,
      category: category.name,
      categoryId: categorySnapshot.id,
      categoryName: category.name,
      categoryGroupId: category.groupId,
      categoryGroupName: categoryGroup.name,
      note: adjustment.note,
      occurredAt: Timestamp.fromDate(adjustment.occurredAt),
      createdAt: FieldValue.serverTimestamp(),
    })
  })
}

export async function deleteAccount(userId: string, accountId: string) {
  const firestore = getFirebaseAdminFirestore()
  const transactionSnapshot = await firestore
    .collection("users")
    .doc(userId)
    .collection("transactions")
    .where("accountIds", "array-contains", accountId)
    .limit(1)
    .get()

  if (!transactionSnapshot.empty) {
    throw new AccountValidationError(
      "Tài khoản đã có giao dịch. Hãy ngừng sử dụng thay vì xoá.",
    )
  }

  await firestore.recursiveDelete(getAccountsCollection(userId).doc(accountId))
}
