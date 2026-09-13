import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Transaction } from "@/lib/transactions/types"

export type TransactionFieldProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  defaultValues?: Transaction
}
