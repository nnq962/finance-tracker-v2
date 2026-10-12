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
  /** A transfer whose source account (which pays the fee) is left out of the figures. */
  fromAccountExcluded?: boolean
  /** A transfer's fee as an expense of its own (withFees), for the figures only. */
  isFee?: boolean
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

/** The category group key a transfer fee is summed under, as MISA's "Phí chuyển khoản". */
export const TRANSFER_FEE_GROUP = "transfer-fee"
export const TRANSFER_FEE_NAME = "Phí chuyển khoản"

/**
 * The transactions, and after each transfer with a fee that fee as an
 * expense paid by the source account (left out with it), so every figure
 * counts fees as spending the same way. For sums only; lists show the
 * transfer alone.
 */
export function withFees(transactions: Transaction[]): Transaction[] {
  return transactions.flatMap((transaction) =>
    transaction.kind === "transfer" && transaction.fee
      ? [
          transaction,
          {
            id: `${transaction.id}:fee`,
            isFee: true,
            kind: "expense" as const,
            title: TRANSFER_FEE_NAME,
            description: `${TRANSFER_FEE_NAME} · ${transaction.fromAccountName ?? "Tài khoản"}`,
            amount: -transaction.fee,
            occurredAt: transaction.occurredAt,
            note: transaction.note,
            accountId: transaction.fromAccountId,
            accountName: transaction.fromAccountName,
            ...(transaction.fromAccountExcluded ? { accountExcluded: true } : {}),
            categoryGroupId: TRANSFER_FEE_GROUP,
            categoryGroupName: TRANSFER_FEE_NAME,
            categoryName: TRANSFER_FEE_NAME,
          },
        ]
      : [transaction],
  )
}
