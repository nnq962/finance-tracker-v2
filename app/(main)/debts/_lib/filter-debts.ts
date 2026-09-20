import type { Debt, DebtDirection } from "../_types/debt"

export type DebtFilter = "all" | DebtDirection | "overdue"

export function filterDebts(debts: Debt[], filter: DebtFilter) {
  if (filter === "all") return debts

  if (filter === "overdue") {
    return debts.filter((debt) => debt.status === "overdue")
  }

  return debts.filter((debt) => debt.direction === filter)
}
