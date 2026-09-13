import type { Debt, DebtSummaryData } from "../_types/debt"

export function getDebtSummary(debts: Debt[]): DebtSummaryData {
  const activeDebts = debts.filter((debt) => debt.status !== "settled")
  const totals = activeDebts.reduce(
    (summary, debt) => {
      const remainingAmount = Math.max(debt.amount - debt.paidAmount, 0)

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
