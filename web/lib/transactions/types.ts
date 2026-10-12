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
  /**
   * A row made for the figures only (forFigures): a transfer's fee as an
   * expense, or the interest part of a loan repayment as income or spending.
   */
  derived?: "fee" | "interest"
  /** The interest part of a loan repayment (source "debt"). */
  interest?: number
  /** A balance corrected by hand ("Điều chỉnh số dư"): no category, deleted rather than edited. */
  adjustment?: boolean
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
/** Likewise for balances corrected by hand. */
export const BALANCE_ADJUSTMENT_GROUP = "balance-adjustment"
export const BALANCE_ADJUSTMENT_NAME = "Điều chỉnh số dư"

/** Likewise for the interest part of loan repayments. */
export const DEBT_INTEREST_GROUP = "debt-interest"
export const DEBT_INTEREST_NAME = "Tiền lãi vay"

/**
 * The transactions as the figures count them: after each transfer with a
 * fee, the fee as an expense paid by the source account (left out with it);
 * after each loan repayment with interest, that interest as income (a loan
 * made) or spending (a loan taken). Every page and the assistant sum through
 * this, so the same month gives the same figures everywhere. For sums only;
 * lists show the transfer or the repayment alone.
 */
export function forFigures(transactions: Transaction[]): Transaction[] {
  return transactions.flatMap((transaction): Transaction[] => {
    if (transaction.kind === "transfer" && transaction.fee) {
      return [
        transaction,
        {
          id: `${transaction.id}:fee`,
          derived: "fee",
          kind: "expense",
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
    }
    if (transaction.source === "debt" && transaction.interest) {
      const comesIn = transaction.kind === "income"
      const name = comesIn ? "Lãi cho vay" : "Lãi đi vay"
      return [
        transaction,
        {
          id: `${transaction.id}:interest`,
          derived: "interest",
          kind: transaction.kind,
          title: name,
          description: `${name} · ${transaction.accountName ?? "Tài khoản"}`,
          amount: comesIn ? transaction.interest : -transaction.interest,
          occurredAt: transaction.occurredAt,
          accountId: transaction.accountId,
          accountName: transaction.accountName,
          ...(transaction.accountExcluded ? { accountExcluded: true } : {}),
          categoryGroupId: DEBT_INTEREST_GROUP,
          categoryGroupName: DEBT_INTEREST_NAME,
          categoryName: name,
        },
      ]
    }
    return [transaction]
  })
}
