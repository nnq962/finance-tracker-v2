import "server-only"

import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin"
import type {
  SupportedTransactionKind,
  Transaction,
  TransactionFormValues,
} from "@/lib/transactions/types"
import { TransactionValidationError } from "@/lib/transactions/validation"

const MAX_MONEY = 999_999_999_999_999

type TransactionDocument = {
  source?: "debt" | "balance_adjustment"
  debtId?: string
  debtPaymentId?: string
  kind: SupportedTransactionKind
  amount: number
  fee?: number
  note?: string
  occurredAt: Timestamp
  accountIds: string[]
  accountId?: string
  accountName?: string
  categoryId?: string
  categoryName?: string
  categoryGroupId?: string
  categoryGroupName?: string
  fromAccountId?: string
  fromAccountName?: string
  toAccountId?: string
  toAccountName?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

type AccountDocument = {
  balance: number
  name: string
  status: "active" | "archived"
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

function getTransactionsCollection(userId: string) {
  return getUserReference(userId).collection("transactions")
}

function getAccountReference(userId: string, accountId: string) {
  return getUserReference(userId).collection("accounts").doc(accountId)
}

function getCategoryItemReference(userId: string, categoryId: string) {
  return getUserReference(userId).collection("categoryItems").doc(categoryId)
}

function getCategoryGroupReference(userId: string, groupId: string) {
  return getUserReference(userId).collection("categoryGroups").doc(groupId)
}

function getAccountIds(values: TransactionFormValues) {
  return values.kind === "transfer"
    ? [values.fromAccountId, values.toAccountId]
    : [values.accountId]
}

function getDocumentAccountIds(document: TransactionDocument) {
  if (document.kind === "transfer") {
    if (!document.fromAccountId || !document.toAccountId) {
      throw new TransactionValidationError("Dữ liệu giao dịch không hợp lệ.")
    }

    return [document.fromAccountId, document.toAccountId]
  }

  if (!document.accountId) {
    throw new TransactionValidationError("Dữ liệu giao dịch không hợp lệ.")
  }

  return [document.accountId]
}

function getBalanceImpacts(
  values: Pick<TransactionDocument, "accountId" | "amount" | "fee" | "fromAccountId" | "kind" | "toAccountId">,
) {
  if (values.kind === "expense") {
    return new Map([[values.accountId as string, -values.amount]])
  }

  if (values.kind === "income") {
    return new Map([[values.accountId as string, values.amount]])
  }

  return new Map([
    [values.fromAccountId as string, -(values.amount + (values.fee ?? 0))],
    [values.toAccountId as string, values.amount],
  ])
}

function mergeImpact(
  impacts: Map<string, number>,
  accountId: string,
  delta: number,
) {
  impacts.set(accountId, (impacts.get(accountId) ?? 0) + delta)
}

function assertBalance(balance: unknown, delta: number) {
  if (!Number.isSafeInteger(balance)) {
    throw new TransactionValidationError("Số dư tài khoản không hợp lệ.")
  }

  const nextBalance = (balance as number) + delta

  if (
    !Number.isSafeInteger(nextBalance) ||
    nextBalance < 0 ||
    nextBalance > MAX_MONEY
  ) {
    throw new TransactionValidationError(
      delta < 0
        ? "Tài khoản không đủ số dư để thực hiện giao dịch."
        : "Số dư tài khoản vượt quá giới hạn cho phép.",
    )
  }

  return nextBalance
}

function toTransaction(id: string, data: TransactionDocument): Transaction {
  if (data.kind === "transfer") {
    return {
      id,
      kind: data.kind,
      title: "Chuyển khoản",
      description: `${data.fromAccountName ?? "Tài khoản"} → ${data.toAccountName ?? "Tài khoản"}${data.fee ? ` · Phí ${data.fee.toLocaleString("vi-VN")}đ` : ""}`,
      amount: data.amount,
      fee: data.fee ?? 0,
      fromAccountId: data.fromAccountId,
      fromAccountName: data.fromAccountName,
      toAccountId: data.toAccountId,
      toAccountName: data.toAccountName,
      note: data.note,
      occurredAt: data.occurredAt.toDate().toISOString(),
    }
  }

  return {
    id,
    source: data.source,
    debtId: data.debtId,
    debtPaymentId: data.debtPaymentId,
    kind: data.kind,
    title: data.source === "balance_adjustment"
      ? `Điều chỉnh số dư · ${data.categoryName ?? "Giao dịch"}`
      : data.categoryName ?? "Giao dịch",
    description: `${data.categoryGroupName ?? "Hạng mục"} · ${data.accountName ?? "Tài khoản"}`,
    amount: data.kind === "expense" ? -data.amount : data.amount,
    accountId: data.accountId,
    accountName: data.accountName,
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    categoryGroupId: data.categoryGroupId,
    categoryGroupName: data.categoryGroupName,
    note: data.note,
    occurredAt: data.occurredAt.toDate().toISOString(),
  }
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const snapshot = await getTransactionsCollection(userId)
    .orderBy("occurredAt", "desc")
    .get()

  // Older payment ledgers remain hidden too; balances are managed by debts.
  return snapshot.docs
    .filter((document) => !(document.get("source") === "debt" && document.get("debtPaymentId")))
    .map((document) =>
      toTransaction(document.id, document.data() as TransactionDocument),
    )
}

async function getTransactionDetails(
  firestoreTransaction: FirebaseFirestore.Transaction,
  userId: string,
  values: TransactionFormValues,
  options: {
    allowedArchivedAccountIds?: Set<string>
    allowedArchivedCategoryId?: string
  } = {},
) {
  const accountIds = getAccountIds(values)
  const accountReferences = accountIds.map((accountId) =>
    getAccountReference(userId, accountId),
  )
  const accountSnapshots = await firestoreTransaction.getAll(...accountReferences)
  const accounts = new Map<string, AccountDocument>()

  accountSnapshots.forEach((snapshot) => {
    const isAllowedArchivedAccount =
      snapshot.exists && options.allowedArchivedAccountIds?.has(snapshot.id)

    if (
      !snapshot.exists ||
      (snapshot.get("status") !== "active" && !isAllowedArchivedAccount)
    ) {
      throw new TransactionValidationError(
        "Tài khoản không tồn tại hoặc đã ngừng sử dụng.",
      )
    }

    accounts.set(snapshot.id, snapshot.data() as AccountDocument)
  })

  if (values.kind === "transfer") {
    return { accounts }
  }

  const itemSnapshot = await firestoreTransaction.get(
    getCategoryItemReference(userId, values.categoryId),
  )

  const isAllowedArchivedCategory =
    itemSnapshot.exists &&
    options.allowedArchivedCategoryId === itemSnapshot.id

  if (
    !itemSnapshot.exists ||
    (itemSnapshot.get("status") !== "active" && !isAllowedArchivedCategory)
  ) {
    throw new TransactionValidationError(
      "Hạng mục không tồn tại hoặc đã ngừng sử dụng.",
    )
  }

  const category = itemSnapshot.data() as CategoryItemDocument

  if (category.type !== values.kind) {
    throw new TransactionValidationError(
      "Hạng mục không phù hợp với loại giao dịch.",
    )
  }

  const groupSnapshot = await firestoreTransaction.get(
    getCategoryGroupReference(userId, category.groupId),
  )

  if (
    !groupSnapshot.exists ||
    (groupSnapshot.get("status") !== "active" && !isAllowedArchivedCategory)
  ) {
    throw new TransactionValidationError(
      "Nhóm hạng mục không tồn tại hoặc đã ngừng sử dụng.",
    )
  }

  const categoryGroup = groupSnapshot.data() as CategoryGroupDocument

  if (categoryGroup.type !== values.kind) {
    throw new TransactionValidationError(
      "Nhóm hạng mục không phù hợp với loại giao dịch.",
    )
  }

  return { accounts, category, categoryGroup }
}

function createDocument(
  values: TransactionFormValues,
  details: Awaited<ReturnType<typeof getTransactionDetails>>,
  timestamps: { createdAt: FieldValue; updatedAt: FieldValue },
) {
  const common = {
    kind: values.kind,
    amount: values.amount,
    occurredAt: Timestamp.fromDate(values.occurredAt),
    accountIds: getAccountIds(values),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    ...(values.note ? { note: values.note } : {}),
  }

  if (values.kind === "transfer") {
    const fromAccount = details.accounts.get(values.fromAccountId)
    const toAccount = details.accounts.get(values.toAccountId)

    if (!fromAccount || !toAccount) {
      throw new TransactionValidationError("Tài khoản không tồn tại.")
    }

    return {
      ...common,
      fee: values.fee,
      fromAccountId: values.fromAccountId,
      fromAccountName: fromAccount.name,
      toAccountId: values.toAccountId,
      toAccountName: toAccount.name,
    }
  }

  const account = details.accounts.get(values.accountId)

  if (!account || !details.category || !details.categoryGroup) {
    throw new TransactionValidationError(
      "Tài khoản hoặc hạng mục không tồn tại.",
    )
  }

  return {
    ...common,
    accountId: values.accountId,
    accountName: account.name,
    categoryId: values.categoryId,
    categoryName: details.category.name,
    categoryGroupId: details.category.groupId,
    categoryGroupName: details.categoryGroup.name,
  }
}

export async function createTransaction(
  userId: string,
  values: TransactionFormValues,
) {
  const firestore = getFirebaseAdminFirestore()
  const transactionReference = getTransactionsCollection(userId).doc()

  await firestore.runTransaction(async (firestoreTransaction) => {
    const details = await getTransactionDetails(
      firestoreTransaction,
      userId,
      values,
    )
    const document = createDocument(values, details, {
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    const impacts = getBalanceImpacts(document)

    impacts.forEach((delta, accountId) => {
      const account = details.accounts.get(accountId)
      const accountReference = getAccountReference(userId, accountId)

      firestoreTransaction.update(accountReference, {
        balance: assertBalance(account?.balance, delta),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })
    firestoreTransaction.create(transactionReference, document)
  })
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  values: TransactionFormValues,
) {
  const firestore = getFirebaseAdminFirestore()
  const transactionReference = getTransactionsCollection(userId).doc(transactionId)

  await firestore.runTransaction(async (firestoreTransaction) => {
    const existingSnapshot = await firestoreTransaction.get(transactionReference)

    if (!existingSnapshot.exists) {
      throw new TransactionValidationError("Giao dịch không tồn tại.")
    }

    if (existingSnapshot.get("source") === "debt") throw new TransactionValidationError("Hãy sửa giao dịch này tại trang Nợ & Cho vay để giữ đồng bộ khoản nợ.")
    const existing = existingSnapshot.data() as TransactionDocument
    const existingAccountIds = new Set(getDocumentAccountIds(existing))
    const details = await getTransactionDetails(
      firestoreTransaction,
      userId,
      values,
      {
        allowedArchivedAccountIds: existingAccountIds,
        allowedArchivedCategoryId: existing.categoryId,
      },
    )
    const allAccountIds = Array.from(
      new Set([...existingAccountIds, ...getAccountIds(values)]),
    )
    const missingAccountIds = allAccountIds.filter(
      (accountId) => !details.accounts.has(accountId),
    )

    if (missingAccountIds.length > 0) {
      const snapshots = await firestoreTransaction.getAll(
        ...missingAccountIds.map((accountId) =>
          getAccountReference(userId, accountId),
        ),
      )

      snapshots.forEach((snapshot) => {
        if (!snapshot.exists) {
          throw new TransactionValidationError(
            "Tài khoản của giao dịch cũ không còn tồn tại.",
          )
        }
        details.accounts.set(snapshot.id, snapshot.data() as AccountDocument)
      })
    }

    const updatedDocument = createDocument(values, details, {
      createdAt: existing.createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    })
    const impacts = new Map<string, number>()

    getBalanceImpacts(existing).forEach((delta, accountId) =>
      mergeImpact(impacts, accountId, -delta),
    )
    getBalanceImpacts(updatedDocument).forEach((delta, accountId) =>
      mergeImpact(impacts, accountId, delta),
    )

    impacts.forEach((delta, accountId) => {
      const account = details.accounts.get(accountId)
      firestoreTransaction.update(getAccountReference(userId, accountId), {
        balance: assertBalance(account?.balance, delta),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })
    firestoreTransaction.set(transactionReference, {
      ...updatedDocument,
      ...(existing.source === "balance_adjustment" ? { source: existing.source } : {}),
    })
  })
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const firestore = getFirebaseAdminFirestore()
  const transactionReference = getTransactionsCollection(userId).doc(transactionId)

  await firestore.runTransaction(async (firestoreTransaction) => {
    const snapshot = await firestoreTransaction.get(transactionReference)

    if (!snapshot.exists) {
      throw new TransactionValidationError("Giao dịch không tồn tại.")
    }

    if (snapshot.get("source") === "debt") throw new TransactionValidationError("Hãy xoá giao dịch này tại trang Nợ & Cho vay để giữ đồng bộ khoản nợ.")
    const document = snapshot.data() as TransactionDocument
    const accountIds = getDocumentAccountIds(document)
    const accountSnapshots = await firestoreTransaction.getAll(
      ...accountIds.map((accountId) => getAccountReference(userId, accountId)),
    )
    const accounts = new Map<string, AccountDocument>()

    accountSnapshots.forEach((accountSnapshot) => {
      if (!accountSnapshot.exists) {
        throw new TransactionValidationError(
          "Tài khoản của giao dịch không còn tồn tại.",
        )
      }
      accounts.set(accountSnapshot.id, accountSnapshot.data() as AccountDocument)
    })

    getBalanceImpacts(document).forEach((delta, accountId) => {
      const account = accounts.get(accountId)
      firestoreTransaction.update(getAccountReference(userId, accountId), {
        balance: assertBalance(account?.balance, -delta),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })
    firestoreTransaction.delete(transactionReference)
  })
}
