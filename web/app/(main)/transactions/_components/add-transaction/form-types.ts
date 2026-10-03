import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Transaction } from "@/lib/transactions/types"

/** Fields the form checks before sending, named as they are submitted. */
export type TransactionFieldName =
  | "amount"
  | "accountId"
  | "categoryId"
  | "fromAccountId"
  | "toAccountId"
  | "date"

export type TransactionFieldErrors = Partial<Record<TransactionFieldName, string>>

/** Props of the fields that differ by kind (accounts, category, fee). */
export type TransactionFieldProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  /** The transaction being edited, when it is of this kind. */
  defaultValues?: Transaction
  errors: TransactionFieldErrors
  /** Clears a field's error once the user changes it. */
  onFieldChange: (name: TransactionFieldName) => void
  onManageCategories?: () => void
}
