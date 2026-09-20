export type TransactionKind = "expense" | "income" | "transfer"

export type SupportedTransactionKind = TransactionKind

export type TransactionFilter = "all" | TransactionKind

export type TransactionPeriod = "week" | "month"

export type TransactionSearchFilters = {
  query: string
  minAmount: number | null
  maxAmount: number | null
  accountIds: string[]
  categoryGroupIds: string[]
}

export type CashFlowTransactionValues = {
  kind: "expense" | "income"
  amount: number
  accountId: string
  categoryId: string
  note?: string
  occurredAt: Date
}

export type TransferTransactionValues = {
  kind: "transfer"
  amount: number
  fee: number
  fromAccountId: string
  toAccountId: string
  note?: string
  occurredAt: Date
}

export type TransactionFormValues =
  | CashFlowTransactionValues
  | TransferTransactionValues

export type Transaction = {
  id: string
  title: string
  description: string
  amount: number
  occurredAt: string
  kind: SupportedTransactionKind
  note?: string
  accountId?: string
  accountName?: string
  categoryId?: string
  categoryName?: string
  categoryGroupId?: string
  categoryGroupName?: string
  fee?: number
  fromAccountId?: string
  fromAccountName?: string
  toAccountId?: string
  toAccountName?: string
}

export type TransactionSummaryData = {
  netBalance: number
  income: number
  expense: number
}

export type TransactionDateGroup = {
  dateKey: string
  weekdayLabel: string
  dateLabel: string
  transactions: Transaction[]
}

export type TransactionActionResult =
  | { success: true }
  | { success: false; error: string }
