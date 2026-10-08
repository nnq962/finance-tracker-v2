import type {
  Transaction,
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"

import { searchKey } from "@/lib/search-text"

export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter,
  searchFilters: TransactionSearchFilters,
) {
  const key = searchKey(searchFilters.query)
  const normalizedQuery = key(searchFilters.query.trim())

  return transactions.filter((transaction) => {
    // Loans move money but are not income or spending.
    const matchesFilter =
      filter === "all" ||
      (filter === "debt"
        ? transaction.source === "debt"
        : !transaction.source && transaction.kind === filter)
    const amount = Math.abs(transaction.amount)
    const matchesAmount =
      (searchFilters.minAmount === null ||
        amount >= searchFilters.minAmount) &&
      (searchFilters.maxAmount === null || amount <= searchFilters.maxAmount)
    const matchesAccount =
      searchFilters.accountIds.length === 0 ||
      searchFilters.accountIds.some(
        (accountId) =>
          transaction.accountId === accountId ||
          transaction.fromAccountId === accountId ||
          transaction.toAccountId === accountId,
      )
    const matchesCategory =
      searchFilters.categoryGroupIds.length === 0 ||
      (transaction.categoryGroupId !== undefined &&
        searchFilters.categoryGroupIds.includes(transaction.categoryGroupId))
    const searchableContent = key(
      `${transaction.title} ${transaction.description} ${transaction.note ?? ""} ${transaction.id}`,
    )

    return (
      matchesFilter &&
      matchesAmount &&
      matchesAccount &&
      matchesCategory &&
      (!normalizedQuery || searchableContent.includes(normalizedQuery))
    )
  })
}
