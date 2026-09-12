import type {
  Transaction,
  TransactionFilter,
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
  query: string,
) {
  const normalizedQuery = normalizeSearchValue(query.trim())

  return transactions.filter((transaction) => {
    const matchesFilter = filter === "all" || transaction.kind === filter
    const searchableContent = normalizeSearchValue(
      `${transaction.title} ${transaction.description} ${transaction.id}`,
    )

    return (
      matchesFilter &&
      (!normalizedQuery || searchableContent.includes(normalizedQuery))
    )
  })
}
