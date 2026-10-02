import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import type { Transaction } from "../_types/transaction"
import { TransactionList } from "./transaction-list"

type TransactionsViewProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  todayDateKey: string
  transactions: Transaction[]
}

export function TransactionsView({
  accounts,
  categoryGroups,
  todayDateKey,
  transactions,
}: TransactionsViewProps) {
  return (
    <section>
      <TransactionList
        accounts={accounts}
        categoryGroups={categoryGroups}
        todayDateKey={todayDateKey}
        transactions={transactions}
      />
    </section>
  )
}
