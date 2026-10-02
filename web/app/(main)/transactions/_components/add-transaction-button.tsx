import { AddTransactionSheet } from "./add-transaction/add-transaction-sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

type AddTransactionButtonProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
}

export function AddTransactionButton(props: AddTransactionButtonProps) {
  return <AddTransactionSheet {...props} />
}
