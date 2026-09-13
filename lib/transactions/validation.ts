import "server-only"

import type {
  SupportedTransactionKind,
  TransactionFormValues,
} from "@/lib/transactions/types"

const supportedKinds = new Set<SupportedTransactionKind>([
  "expense",
  "income",
  "transfer",
])

export class TransactionValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TransactionValidationError"
  }
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function getBoundedText(
  formData: FormData,
  name: string,
  label: string,
  maxLength: number,
) {
  const value = getText(formData, name)

  if (value.length > maxLength) {
    throw new TransactionValidationError(
      `${label} không được vượt quá ${maxLength} ký tự.`,
    )
  }

  return value
}

function getMoney(
  formData: FormData,
  name: string,
  label: string,
  options: { allowZero?: boolean } = {},
) {
  const rawValue = getText(formData, name)
  const value = Number(rawValue || 0)
  const minimum = options.allowZero ? 0 : 1

  if (
    (!rawValue && !options.allowZero) ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > 999_999_999_999_999
  ) {
    throw new TransactionValidationError(`${label} không hợp lệ.`)
  }

  return value
}

export function assertTransactionId(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9_-]{1,1500}$/.test(value)
  ) {
    throw new TransactionValidationError("Giao dịch không hợp lệ.")
  }
}

function getDocumentId(formData: FormData, name: string, label: string) {
  const value = getText(formData, name)

  if (!/^[A-Za-z0-9_-]{1,1500}$/.test(value)) {
    throw new TransactionValidationError(`${label} không hợp lệ.`)
  }

  return value
}

function getOccurredAt(formData: FormData) {
  const date = getText(formData, "date")
  const time = getText(formData, "time")
  const occurredAt = new Date(`${date}T${time}:00+07:00`)

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    Number.isNaN(occurredAt.getTime()) ||
    occurredAt.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }) !== date
  ) {
    throw new TransactionValidationError("Thời gian giao dịch không hợp lệ.")
  }

  return occurredAt
}

export function parseTransactionFormData(
  formData: FormData,
): TransactionFormValues {
  const kind = getText(formData, "kind") as SupportedTransactionKind

  if (!supportedKinds.has(kind)) {
    throw new TransactionValidationError(
      "Loại giao dịch này chưa được hỗ trợ.",
    )
  }

  const commonValues = {
    amount: getMoney(formData, "amount", "Số tiền"),
    occurredAt: getOccurredAt(formData),
    note: getBoundedText(formData, "note", "Ghi chú", 500) || undefined,
  }

  if (kind === "transfer") {
    const fromAccountId = getDocumentId(
      formData,
      "fromAccountId",
      "Tài khoản nguồn",
    )
    const toAccountId = getDocumentId(
      formData,
      "toAccountId",
      "Tài khoản đích",
    )

    if (fromAccountId === toAccountId) {
      throw new TransactionValidationError(
        "Tài khoản nguồn và đích phải khác nhau.",
      )
    }

    return {
      ...commonValues,
      kind,
      fee: getMoney(formData, "fee", "Phí chuyển", { allowZero: true }),
      fromAccountId,
      toAccountId,
    }
  }

  return {
    ...commonValues,
    kind,
    accountId: getDocumentId(formData, "accountId", "Tài khoản"),
    categoryId: getDocumentId(formData, "categoryId", "Hạng mục"),
  }
}
