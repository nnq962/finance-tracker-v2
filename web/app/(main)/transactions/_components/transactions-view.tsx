import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import type { Transaction } from "../_types/transaction"
import { TransactionList } from "./transaction-list"

type TransactionsViewProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  todayDateKey: string
  transactions: Transaction[]
  isFiltering: boolean
  onClearFilters: () => void
}

export function TransactionsView({
  accounts,
  categoryGroups,
  todayDateKey,
  transactions,
  isFiltering,
  onClearFilters,
}: TransactionsViewProps) {
  return (
    <section>
      <TransactionList
        accounts={accounts}
        categoryGroups={categoryGroups}
        todayDateKey={todayDateKey}
        transactions={transactions}
        isFiltering={isFiltering}
        onClearFilters={onClearFilters}
      />
    </section>
  )
}
