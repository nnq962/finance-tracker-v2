import type {
  Transaction,
  TransactionSummaryData,
} from "../_types/transaction"

export function getTransactionSummary(
  transactions: Transaction[],
): TransactionSummaryData {
  const summary = transactions.reduce(
    (totals, transaction) => {
      // Loans and repayments move money without being income or spending;
      // a transaction the user left out of the figures is left out here.
      if (transaction.source === "debt" || transaction.excluded) return totals

      if (transaction.kind === "income") {
        totals.income += Math.abs(transaction.amount)
      }

      if (transaction.kind === "expense") {
        totals.expense += Math.abs(transaction.amount)
      }

      if (transaction.kind === "transfer") {
        totals.expense += transaction.fee ?? 0
      }

      return totals
    },
    { income: 0, expense: 0 },
  )

  return {
    ...summary,
    netBalance: summary.income - summary.expense,
  }
}
