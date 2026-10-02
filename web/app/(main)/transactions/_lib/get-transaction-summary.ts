import type {
  Transaction,
  TransactionSummaryData,
} from "../_types/transaction"

export function getTransactionSummary(
  transactions: Transaction[],
): TransactionSummaryData {
  const summary = transactions.reduce(
    (totals, transaction) => {
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
