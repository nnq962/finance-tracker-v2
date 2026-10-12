import { summarizeFigures } from "@/lib/transactions/types"
import type {
  Transaction,
  TransactionSummaryData,
} from "../_types/transaction"

/**
 * Income and spending as every page counts them: transfer fees and loan
 * interest as rows of their own, loans and repayments otherwise neither,
 * and what the user left out of the figures left out (summarizeFigures).
 */
export function getTransactionSummary(
  transactions: Transaction[],
): TransactionSummaryData {
  const { income, expense } = summarizeFigures(transactions)
  return { income, expense, netBalance: income - expense }
}
