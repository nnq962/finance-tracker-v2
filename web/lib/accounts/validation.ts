import "server-only"

import type { AccountFormValues, AccountType } from "@/lib/accounts/types"
import { isUuid } from "@/lib/db/ids"
import { getInstitution } from "@/lib/institutions"
import { MAX_MONEY } from "@/lib/money"

const accountTypes = new Set<AccountType>(["cash", "bank", "e-wallet"])

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
    value > MAX_MONEY
  ) {
    throw new AccountValidationError(`${label} không hợp lệ.`)
  }

  return value
}

export function parseAccountFormData(formData: FormData) {
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
    balance: getMoney(formData, "balance", "Số dư"),
  }
  const note = getBoundedText(formData, "note", "Ghi chú", 500)

  if (type !== "cash") values.institutionId = institutionId
  if (note) values.note = note

  return values
}

/** Balance the edit form was opened with, to detect concurrent changes. */
export function parseExpectedBalance(formData: FormData) {
  return getMoney(formData, "expectedBalance", "Số dư hiện tại")
}

export function assertAccountId(accountId: string) {
  if (!isUuid(accountId)) {
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
