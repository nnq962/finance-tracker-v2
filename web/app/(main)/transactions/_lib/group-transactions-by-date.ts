import type {
  Transaction,
  TransactionDateGroup,
} from "../_types/transaction"

import { getTransactionDateKey } from "./get-transaction-period"

export function groupTransactionsByDate(
  transactions: Transaction[],
): TransactionDateGroup[] {
  const sortedTransactions = [...transactions].sort((first, second) =>
    second.occurredAt.localeCompare(first.occurredAt),
  )
  const groups = new Map<string, Transaction[]>()

  for (const transaction of sortedTransactions) {
    const dateKey = getTransactionDateKey(transaction.occurredAt)
    const group = groups.get(dateKey) ?? []
    group.push(transaction)
    groups.set(dateKey, group)
  }

  return Array.from(groups, ([dateKey, groupedTransactions]) => {
    return {
      dateKey,
      transactions: groupedTransactions,
    }
  })
}
