import type {
  Transaction,
  TransactionDateGroup,
} from "../_types/transaction"

const dayFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
})

export function groupTransactionsByDate(
  transactions: Transaction[],
): TransactionDateGroup[] {
  const sortedTransactions = [...transactions].sort((first, second) =>
    second.occurredAt.localeCompare(first.occurredAt),
  )
  const groups = new Map<string, Transaction[]>()

  for (const transaction of sortedTransactions) {
    const dateKey = transaction.occurredAt.slice(0, 10)
    const group = groups.get(dateKey) ?? []
    group.push(transaction)
    groups.set(dateKey, group)
  }

  return Array.from(groups, ([dateKey, groupedTransactions]) => ({
    dateKey,
    label: dayFormatter.format(new Date(`${dateKey}T00:00:00+07:00`)),
    transactions: groupedTransactions,
  }))
}
