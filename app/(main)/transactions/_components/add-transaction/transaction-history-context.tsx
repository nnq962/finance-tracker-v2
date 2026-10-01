"use client"

import * as React from "react"

import type {
  SupportedTransactionKind,
  Transaction,
} from "@/lib/transactions/types"

const TransactionHistoryContext = React.createContext<Transaction[]>([])

/** Recent transactions the add/edit forms learn quick picks from. */
export function TransactionHistoryProvider({
  transactions,
  children,
}: {
  transactions: Transaction[]
  children: React.ReactNode
}) {
  // Debt movements and balance adjustments aren't amounts people type.
  const userEntered = React.useMemo(
    () =>
      transactions
        .filter((transaction) => !transaction.source)
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
    [transactions],
  )

  return (
    <TransactionHistoryContext.Provider value={userEntered}>
      {children}
    </TransactionHistoryContext.Provider>
  )
}

/** Newest-first history of one kind, excluding the transaction being edited. */
export function useTransactionHistory(
  kind: SupportedTransactionKind,
  excludeId?: string,
) {
  const transactions = React.useContext(TransactionHistoryContext)

  return React.useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.kind === kind && transaction.id !== excludeId,
      ),
    [excludeId, kind, transactions],
  )
}
