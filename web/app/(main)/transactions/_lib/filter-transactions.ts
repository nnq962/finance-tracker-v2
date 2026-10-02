import type {
  Transaction,
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi-VN")
}

export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter,
  searchFilters: TransactionSearchFilters,
) {
  const normalizedQuery = normalizeSearchValue(searchFilters.query.trim())

  return transactions.filter((transaction) => {
    const matchesFilter = filter === "all" || transaction.kind === filter
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
    const searchableContent = normalizeSearchValue(
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
