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

const MAX_MONEY = 999_999_999_999_999
const MAX_DELETION_WRITES = 450

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
  const reference = getAccountsCollection(userId).doc(accountId)
  await getFirebaseAdminFirestore().runTransaction(async (transaction) => {
    const account = await transaction.get(reference)
    if (!account.exists || account.get("status") !== "active") {
      throw new AccountValidationError("Tài khoản đã ngừng sử dụng. Hãy kích hoạt lại trước khi chỉnh sửa.")
    }
    transaction.update(reference, {
      name: values.name,
      type: values.type,
      institutionId: values.institutionId ?? FieldValue.delete(),
      note: values.note ?? FieldValue.delete(),
      excludeFromReports: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    })
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
  const transactionReference = getUserReference(userId)
    .collection("transactions")
    .doc()

  await firestore.runTransaction(async (transaction) => {
    const [accountSnapshot, categorySnapshot] = await transaction.getAll(
      accountReference,
      categoryReference,
    )

    if (!accountSnapshot.exists) {
      throw new AccountValidationError("Tài khoản không tồn tại.")
    }

    if (accountSnapshot.get("status") !== "active") {
      throw new AccountValidationError("Tài khoản đã ngừng sử dụng. Hãy kích hoạt lại trước khi điều chỉnh số dư.")
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
    transaction.create(transactionReference, {
      source: "balance_adjustment",
      kind: expectedCategoryType,
      amount: Math.abs(difference),
      accountId,
      accountIds: [accountId],
      accountName: accountSnapshot.get("name"),
      categoryId: categorySnapshot.id,
      categoryName: category.name,
      categoryGroupId: category.groupId,
      categoryGroupName: categoryGroup.name,
      note: adjustment.note,
      occurredAt: Timestamp.fromDate(adjustment.occurredAt),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
}

export async function deleteAccount(userId: string, accountId: string) {
  const firestore = getFirebaseAdminFirestore()
  const userReference = getUserReference(userId)
  const accountReference = getAccountsCollection(userId).doc(accountId)

  await firestore.runTransaction(async (transaction) => {
    const accountSnapshot = await transaction.get(accountReference)
    if (!accountSnapshot.exists) return

    const [transactionSnapshot, debtSnapshot, adjustmentSnapshot] = await Promise.all([
      transaction.get(
        userReference
          .collection("transactions")
          .where("accountIds", "array-contains", accountId)
      ),
      transaction.get(
        userReference
          .collection("debts")
          .where("accountIds", "array-contains", accountId)
      ),
      transaction.get(accountReference.collection("balanceAdjustments")),
    ])

    const transactionDocuments = new Map(
      transactionSnapshot.docs.map((document) => [document.ref.path, document]),
    )
    const paymentDocuments: FirebaseFirestore.QueryDocumentSnapshot[] = []

    for (const debt of debtSnapshot.docs) {
      const [payments, ledgers] = await Promise.all([
        transaction.get(debt.ref.collection("payments")),
        transaction.get(
          userReference.collection("transactions").where("debtId", "==", debt.id),
        ),
      ])
      paymentDocuments.push(...payments.docs)
      for (const ledger of ledgers.docs) {
        transactionDocuments.set(ledger.ref.path, ledger)
      }
    }

    const deltas = new Map<string, number>()
    const addDelta = (id: unknown, value: number) => {
      if (typeof id !== "string" || !Number.isSafeInteger(value)) {
        throw new AccountValidationError("Dữ liệu liên kết với tài khoản không hợp lệ.")
      }
      if (id !== accountId) deltas.set(id, (deltas.get(id) ?? 0) + value)
    }

    for (const document of transactionDocuments.values()) {
      if (document.get("source") === "debt") continue
      const kind = document.get("kind")
      const amount = document.get("amount")
      const fee = document.get("fee") ?? 0
      if (!Number.isSafeInteger(amount) || amount < 0 || !Number.isSafeInteger(fee) || fee < 0) {
        throw new AccountValidationError("Giao dịch liên quan có số tiền không hợp lệ.")
      }
      if (kind === "transfer") {
        addDelta(document.get("fromAccountId"), amount + fee)
        addDelta(document.get("toAccountId"), -amount)
      } else if (kind === "income" || kind === "expense") {
        addDelta(document.get("accountId"), kind === "income" ? -amount : amount)
      } else {
        throw new AccountValidationError("Giao dịch liên quan có loại không hợp lệ.")
      }
    }

    for (const debt of debtSnapshot.docs) {
      const amount = debt.get("amount")
      const direction = debt.get("direction")
      if (!Number.isSafeInteger(amount) || amount < 0 || (direction !== "borrowed" && direction !== "lent")) {
        throw new AccountValidationError("Khoản nợ liên quan không hợp lệ.")
      }
      const principalSign = direction === "borrowed" ? 1 : -1
      if (debt.get("recordingMode") !== "opening") addDelta(debt.get("accountId"), -principalSign * amount)
      for (const payment of paymentDocuments.filter((item) => item.ref.parent.parent?.id === debt.id)) {
        const paymentAmount = payment.get("amount")
        if (!Number.isSafeInteger(paymentAmount) || paymentAmount < 0) {
          throw new AccountValidationError("Lịch sử thanh toán không hợp lệ.")
        }
        addDelta(payment.get("accountId"), principalSign * paymentAmount)
      }
    }

    const relatedAccounts = deltas.size
      ? await transaction.getAll(
          ...[...deltas.keys()].map((id) => getAccountsCollection(userId).doc(id)),
        )
      : []
    const writeCount = 1 + transactionDocuments.size + debtSnapshot.size +
      paymentDocuments.length + adjustmentSnapshot.size + relatedAccounts.length
    if (writeCount > MAX_DELETION_WRITES) {
      throw new AccountValidationError(
        "Tài khoản có quá nhiều dữ liệu liên quan để xoá trong một lần. Vui lòng liên hệ hỗ trợ.",
      )
    }

    for (const relatedAccount of relatedAccounts) {
      const balance = relatedAccount.get("balance")
      const nextBalance = balance + deltas.get(relatedAccount.id)!
      if (!relatedAccount.exists || !Number.isSafeInteger(balance) ||
        !Number.isSafeInteger(nextBalance) || nextBalance < 0 || nextBalance > MAX_MONEY) {
        throw new AccountValidationError(
          "Không thể xoá vì số dư của tài khoản liên quan sẽ không hợp lệ.",
        )
      }
      transaction.update(relatedAccount.ref, {
        balance: nextBalance,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    for (const document of transactionDocuments.values()) transaction.delete(document.ref)
    for (const document of paymentDocuments) transaction.delete(document.ref)
    for (const document of debtSnapshot.docs) transaction.delete(document.ref)
    for (const document of adjustmentSnapshot.docs) transaction.delete(document.ref)
    transaction.delete(accountReference)
  })
}
