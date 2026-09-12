"use client"

import * as React from "react"

import {
  getLatestTransactionDateKey,
  getTransactionPeriod,
  shiftPeriodAnchor,
} from "../_lib/get-transaction-period"
import { getTransactionSummary } from "../_lib/get-transaction-summary"
import type {
  Transaction,
  TransactionPeriod,
} from "../_types/transaction"
import { TransactionSummary } from "./transaction-summary"
import { TransactionsHeader } from "./transactions-header"
import { TransactionsView } from "./transactions-view"
import { TransactionPeriodFilter } from "./transaction-period-filter"

type TransactionsDashboardProps = {
  transactions: Transaction[]
}

export function TransactionsDashboard({
  transactions,
}: TransactionsDashboardProps) {
  const [transactionItems, setTransactionItems] = React.useState(transactions)
  const latestDateKey = React.useMemo(
    () => getLatestTransactionDateKey(transactionItems),
    [transactionItems],
  )
  const [period, setPeriod] = React.useState<TransactionPeriod>("month")
  const [anchorDateKey, setAnchorDateKey] = React.useState(latestDateKey)
  const periodData = React.useMemo(
    () =>
      getTransactionPeriod(
        transactionItems,
        period,
        anchorDateKey,
        latestDateKey,
      ),
    [anchorDateKey, latestDateKey, period, transactionItems],
  )
  const summary = React.useMemo(
    () => getTransactionSummary(periodData.transactions),
    [periodData.transactions],
  )

  return (
    <>
      <TransactionsHeader>
        <TransactionPeriodFilter
          period={period}
          rangeLabel={periodData.rangeLabel}
          contextLabel={periodData.contextLabel}
          transactionCount={periodData.transactions.length}
          canGoNext={!periodData.isCurrent}
          onPeriodChange={(nextPeriod) => {
            setPeriod(nextPeriod)
            setAnchorDateKey(latestDateKey)
          }}
          onPrevious={() =>
            setAnchorDateKey((current) =>
              shiftPeriodAnchor(current, period, -1),
            )
          }
          onNext={() =>
            setAnchorDateKey((current) =>
              shiftPeriodAnchor(current, period, 1),
            )
          }
          onReset={() => setAnchorDateKey(latestDateKey)}
        />
      </TransactionsHeader>
      <TransactionSummary summary={summary} />
      <TransactionsView
        transactions={periodData.transactions}
        onDelete={(transactionId) =>
          setTransactionItems((current) =>
            current.filter((transaction) => transaction.id !== transactionId),
          )
        }
      />
    </>
  )
}
