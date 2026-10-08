import type {
  Transaction,
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"

/** Lower case, without accents, đ as d: "Đi lại" → "di lai". */
export function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("vi-VN")
}

/** Whether a query is typed with accents (or đ), and so means them. */
export function hasAccents(value: string) {
  return /[\u0300-\u036f]|[đĐ]/.test(value.normalize("NFD"))
}

/**
 * How text is compared with a query, as Vietnamese apps search: typed with
 * accents, the accents count ("ăn" finds "Ăn trưa", not "khoản" or "Lan");
 * typed without, they do not ("an" finds all three). Case never counts.
 */
export function searchKey(query: string): (value: string) => string {
  if (hasAccents(query)) return (value) => value.normalize("NFC").toLocaleLowerCase("vi-VN")
  return normalizeSearchValue
}

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
