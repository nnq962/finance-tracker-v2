import { getPaymentMetrics } from "./debt-payments"
import type { Debt, DebtSummaryData } from "../_types/debt"

export function getDebtSummary(debts: Debt[]): DebtSummaryData {
  const activeDebts = debts.filter((debt) => debt.status !== "settled")
  const totals = activeDebts.reduce(
    (summary, debt) => {
      const remainingAmount = getPaymentMetrics(debt).remainingAmount

      if (debt.direction === "lent") summary.totalLent += remainingAmount
      if (debt.direction === "borrowed") summary.totalBorrowed += remainingAmount

      return summary
    },
    { totalLent: 0, totalBorrowed: 0 },
  )

  return {
    ...totals,
    netBalance: totals.totalLent - totals.totalBorrowed,
  }
}
