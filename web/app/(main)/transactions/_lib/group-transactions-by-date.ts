import type {
  Transaction,
  TransactionDateGroup,
} from "../_types/transaction"
import { getTransactionDateKey } from "./get-transaction-period"

const weekdayFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  timeZone: "Asia/Ho_Chi_Minh",
})

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
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
    const dateKey = getTransactionDateKey(transaction.occurredAt)
    const group = groups.get(dateKey) ?? []
    group.push(transaction)
    groups.set(dateKey, group)
  }

  return Array.from(groups, ([dateKey, groupedTransactions]) => {
    const date = new Date(`${dateKey}T00:00:00+07:00`)

    return {
      dateKey,
      weekdayLabel: weekdayFormatter.format(date),
      dateLabel: dateFormatter.format(date).replaceAll("-", "/"),
      transactions: groupedTransactions,
    }
  })
}
