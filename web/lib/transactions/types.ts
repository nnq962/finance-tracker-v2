export type TransactionKind = "expense" | "income" | "transfer"

export type SupportedTransactionKind = TransactionKind

/** "debt" is loans and their repayments, kept apart from income and spending. */
export type TransactionFilter = "all" | TransactionKind | "debt"

export type TransactionPeriod = "week" | "month"

export type TransactionSearchFilters = {
  query: string
  /** Only the transactions left out of the figures. */
  excludedOnly?: boolean
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
  /** Left out of the figures (totals, charts, the assistant), still moving the balance. */
  excluded?: boolean
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
  source?: "debt"
  debtId?: string
  id: string
  title: string
  description: string
  amount: number
  occurredAt: string
  kind: SupportedTransactionKind
  note?: string
  /** Left out of the figures (totals, charts, the assistant); the balance still moved. */
  excluded?: boolean
  /** Its account is left out of the figures, and so is it, whatever `excluded` says. */
  accountExcluded?: boolean
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
  transactions: Transaction[]
}

export type TransactionActionResult =
  | { success: true }
  | { success: false; error: string }

/** Money into and out of an account over a range, and how many movements each way. */
export type AccountFlow = { moneyIn: number; moneyOut: number; inCount: number; outCount: number }

/**
 * Whether a transaction stays out of the figures: left out itself, or its
 * account is. Transfers are never in them anyway.
 */
export function isLeftOut(transaction: Pick<Transaction, "excluded" | "accountExcluded">) {
  return Boolean(transaction.excluded || transaction.accountExcluded)
}
