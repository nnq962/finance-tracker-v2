import "server-only"

import type { AccountFormValues, AccountType } from "@/lib/accounts/types"
import { getInstitution } from "@/lib/institutions"

const accountTypes = new Set<AccountType>(["cash", "bank", "e-wallet"])

export const balanceAdjustmentCategories = new Set([
  "Đối soát số dư",
  "Lãi tài khoản",
  "Phí dịch vụ",
  "Khác",
])

export class AccountValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AccountValidationError"
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
  required = false,
) {
  const value = getText(formData, name)

  if (required && !value) {
    throw new AccountValidationError(`${label} là bắt buộc.`)
  }

  if (value.length > maxLength) {
    throw new AccountValidationError(
      `${label} không được vượt quá ${maxLength} ký tự.`,
    )
  }

  return value
}

function getMoney(formData: FormData, name: string, label: string) {
  const rawValue = getText(formData, name)
  const value = Number(rawValue)

  if (
    !rawValue ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 999_999_999_999_999
  ) {
    throw new AccountValidationError(`${label} không hợp lệ.`)
  }

  return value
}

export function parseAccountFormData(
  formData: FormData,
  options: { includeBalance: boolean },
) {
  const type = getText(formData, "type") as AccountType
  const institutionId = getText(formData, "institutionId")

  if (!accountTypes.has(type)) {
    throw new AccountValidationError("Loại tài khoản không hợp lệ.")
  }

  if (
    type !== "cash" &&
    (!institutionId || !getInstitution(type, institutionId))
  ) {
    throw new AccountValidationError(
      "Ngân hàng hoặc ví điện tử không hợp lệ.",
    )
  }

  const values: AccountFormValues = {
    name: getBoundedText(formData, "name", "Tên tài khoản", 80, true),
    type,
    balance: options.includeBalance
      ? getMoney(formData, "balance", "Số dư")
      : 0,
    excludeFromReports: formData.get("excludeFromReports") === "on",
  }
  const note = getBoundedText(formData, "note", "Ghi chú", 500)

  if (type !== "cash") values.institutionId = institutionId
  if (note) values.note = note

  return values
}

export function parseBalanceAdjustment(formData: FormData) {
  const category = getText(formData, "category")
  const date = getText(formData, "date")
  const time = getText(formData, "time")
  const occurredAt = new Date(`${date}T${time}:00+07:00`)

  if (!balanceAdjustmentCategories.has(category)) {
    throw new AccountValidationError("Hạng mục điều chỉnh không hợp lệ.")
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    Number.isNaN(occurredAt.getTime()) ||
    occurredAt.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }) !== date
  ) {
    throw new AccountValidationError("Thời gian điều chỉnh không hợp lệ.")
  }

  return {
    actualBalance: getMoney(formData, "actualBalance", "Số dư thực tế"),
    category,
    occurredAt,
    note: getBoundedText(formData, "note", "Ghi chú", 500),
  }
}

export function assertAccountId(accountId: string) {
  if (!/^[A-Za-z0-9_-]{1,1500}$/.test(accountId)) {
    throw new AccountValidationError("Tài khoản không hợp lệ.")
  }
}

export function assertBoolean(
  value: unknown,
  label: string,
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new AccountValidationError(`${label} không hợp lệ.`)
  }
}
