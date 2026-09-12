export type TransactionKind = "expense" | "income" | "transfer" | "loan"

export type TransactionFilter = "all" | TransactionKind

export type TransactionPeriod = "week" | "month"

export type Transaction = {
  id: string
  title: string
  description: string
  amount: number
  occurredAt: string
  kind: TransactionKind
}

export type TransactionSummaryData = {
  netBalance: number
  income: number
  expense: number
}

export type TransactionDateGroup = {
  dateKey: string
  label: string
  transactions: Transaction[]
}
