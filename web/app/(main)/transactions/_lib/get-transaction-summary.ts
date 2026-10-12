import { isLeftOut, withFees } from "@/lib/transactions/types"
import type {
  Transaction,
  TransactionSummaryData,
} from "../_types/transaction"

export function getTransactionSummary(
  transactions: Transaction[],
): TransactionSummaryData {
  const summary = withFees(transactions).reduce(
    (totals, transaction) => {
      // Loans and repayments move money without being income or spending;
      // a transaction the user left out of the figures is left out here.
      // A transfer's fee comes as an expense of its own (withFees).
      if (transaction.source === "debt" || isLeftOut(transaction)) return totals

      if (transaction.kind === "income") {
        totals.income += Math.abs(transaction.amount)
      }

      if (transaction.kind === "expense") {
        totals.expense += Math.abs(transaction.amount)
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
