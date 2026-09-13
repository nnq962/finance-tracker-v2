"use client"

import * as React from "react"

import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { filterTransactions } from "../_lib/filter-transactions"
import type {
  Transaction,
  TransactionFilter,
} from "../_types/transaction"
import { TransactionList } from "./transaction-list"
import { TransactionToolbar } from "./transaction-toolbar"

type TransactionsViewProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transactions: Transaction[]
}

export function TransactionsView({
  accounts,
  categoryGroups,
  transactions,
}: TransactionsViewProps) {
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const [query, setQuery] = React.useState("")
  const visibleTransactions = React.useMemo(
    () => filterTransactions(transactions, filter, query),
    [filter, query, transactions],
  )

  return (
    <section className="space-y-6">
      <TransactionToolbar
        filter={filter}
        query={query}
        onFilterChange={setFilter}
        onQueryChange={setQuery}
      />
      <TransactionList
        accounts={accounts}
        categoryGroups={categoryGroups}
        transactions={visibleTransactions}
      />
    </section>
  )
}
