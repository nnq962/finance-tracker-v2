import type { SupportedTransactionKind } from "@/lib/transactions/types"
import { toDateKey } from "@/lib/format-date"

import type { TransactionFieldErrors } from "./form-types"

const text = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

/**
 * What is missing or wrong before the form is sent, per field, in the words
 * shown under it. The server checks everything again.
 */
export function validateTransactionForm(
  formData: FormData,
  kind: SupportedTransactionKind,
): TransactionFieldErrors {
  const errors: TransactionFieldErrors = {}

  if (!(Number(text(formData, "amount")) > 0)) errors.amount = "Nhập số tiền."

  if (kind === "transfer") {
    if (!text(formData, "fromAccountId")) errors.fromAccountId = "Chọn tài khoản chuyển đi."
    if (!text(formData, "toAccountId")) errors.toAccountId = "Chọn tài khoản nhận."
  } else {
    if (!text(formData, "accountId")) errors.accountId = "Chọn tài khoản."
    if (!text(formData, "categoryId")) errors.categoryId = "Chọn hạng mục."
  }

  const date = text(formData, "date")
  if (!date || !text(formData, "time")) errors.date = "Chọn ngày và giờ."
  else if (date > toDateKey(new Date())) errors.date = "Không thể chọn ngày sau hôm nay."
  else if (date < "2000-01-01") errors.date = "Chọn ngày từ năm 2000 trở đi."

  return errors
}
