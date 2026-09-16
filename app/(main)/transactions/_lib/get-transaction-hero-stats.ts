import type { CategoryGroup } from "@/lib/categories/types"

import type { Transaction } from "../_types/transaction"
import { getTransactionSummary } from "./get-transaction-summary"

export type TransactionTrend = {
  direction: "up" | "down" | "flat"
  percentage: number | null
}

export type TopExpenseCategory = {
  amount: number
  count: number
  group: CategoryGroup | undefined
  name: string
  percentage: number
}

export type TransactionHeroStats = {
  expense: number
  expenseCount: number
  expenseTrend: TransactionTrend
  income: number
  incomeCount: number
  incomeTrend: TransactionTrend
  topExpenseCategory: TopExpenseCategory | null
}

function getTrend(current: number, previous: number): TransactionTrend {
  const direction =
    current > previous ? "up" : current < previous ? "down" : "flat"

  if (previous === 0) {
    return {
      direction,
      percentage: current === 0 ? 0 : null,
    }
  }

  return {
    direction,
    percentage: Math.round((Math.abs(current - previous) / previous) * 100),
  }
}

function getTopExpenseCategory(
  transactions: Transaction[],
  categoryGroups: CategoryGroup[],
  totalExpense: number,
): TopExpenseCategory | null {
  const expensesByGroup = new Map<
    string,
    { amount: number; count: number; groupId?: string; name: string }
  >()

  transactions.forEach((transaction) => {
    if (transaction.kind !== "expense") return

    const name = transaction.categoryGroupName ?? "Chưa phân loại"
    const key = transaction.categoryGroupId ?? `name:${name}`
    const current = expensesByGroup.get(key) ?? {
      amount: 0,
      count: 0,
      groupId: transaction.categoryGroupId,
      name,
    }

    current.amount += Math.abs(transaction.amount)
    current.count += 1
    expensesByGroup.set(key, current)
  })

  const topExpense = [...expensesByGroup.values()].sort(
    (left, right) => right.amount - left.amount,
  )[0]

  if (!topExpense) return null

  return {
    amount: topExpense.amount,
    count: topExpense.count,
    group: categoryGroups.find((group) => group.id === topExpense.groupId),
    name: topExpense.name,
    percentage:
      totalExpense > 0
        ? Math.round((topExpense.amount / totalExpense) * 100)
        : 0,
  }
}

export function getTransactionHeroStats(
  transactions: Transaction[],
  previousTransactions: Transaction[],
  categoryGroups: CategoryGroup[],
): TransactionHeroStats {
  const summary = getTransactionSummary(transactions)
  const previousSummary = getTransactionSummary(previousTransactions)

  return {
    income: summary.income,
    incomeCount: transactions.filter(
      (transaction) => transaction.kind === "income",
    ).length,
    incomeTrend: getTrend(summary.income, previousSummary.income),
    expense: summary.expense,
    expenseCount: transactions.filter(
      (transaction) =>
        transaction.kind === "expense" ||
        (transaction.kind === "transfer" && (transaction.fee ?? 0) > 0),
    ).length,
    expenseTrend: getTrend(summary.expense, previousSummary.expense),
    topExpenseCategory: getTopExpenseCategory(
      transactions,
      categoryGroups,
      summary.expense,
    ),
  }
}
