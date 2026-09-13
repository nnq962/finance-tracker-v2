import type { Debt, DebtDirection } from "../_types/debt"

export type DebtFilter = "all" | DebtDirection

export function filterDebts(debts: Debt[], filter: DebtFilter) {
  if (filter === "all") return debts

  return debts.filter((debt) => debt.direction === filter)
}
