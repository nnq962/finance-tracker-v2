import type { Debt, DebtDirection } from "../_types/debt"
import { getDebtDeadline } from "./debt-presentation"

export type DebtFilter = "all" | DebtDirection | "overdue"

export function filterDebts(debts: Debt[], filter: DebtFilter) {
  if (filter === "all") return debts

  if (filter === "overdue") {
    return debts.filter((debt) => getDebtDeadline(debt).isOverdue)
  }

  return debts.filter((debt) => debt.direction === filter)
}
