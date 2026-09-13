"use client"

import * as React from "react"

import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

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
import { AddTransactionButton } from "./add-transaction-button"
import { TransactionSummary } from "./transaction-summary"
import { TransactionsHeader } from "./transactions-header"
import { TransactionsView } from "./transactions-view"
import { TransactionPeriodFilter } from "./transaction-period-filter"

type TransactionsDashboardProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transactions: Transaction[]
}

export function TransactionsDashboard({
  accounts,
  categoryGroups,
  transactions,
}: TransactionsDashboardProps) {
  const latestDateKey = React.useMemo(
    () => getLatestTransactionDateKey(transactions),
    [transactions],
  )
  const [period, setPeriod] = React.useState<TransactionPeriod>("month")
  const [anchorDateKey, setAnchorDateKey] = React.useState(latestDateKey)
  const effectiveAnchorDateKey =
    anchorDateKey === "0000-00-00" ? latestDateKey : anchorDateKey
  const periodData = React.useMemo(
    () =>
      getTransactionPeriod(
        transactions,
        period,
        effectiveAnchorDateKey,
        latestDateKey,
      ),
    [effectiveAnchorDateKey, latestDateKey, period, transactions],
  )
  const summary = React.useMemo(
    () => getTransactionSummary(periodData.transactions),
    [periodData.transactions],
  )

  return (
    <>
      <TransactionsHeader>
        <AddTransactionButton
          accounts={accounts}
          categoryGroups={categoryGroups}
        />
      </TransactionsHeader>
      <TransactionSummary summary={summary} />
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
      <TransactionsView
        accounts={accounts}
        categoryGroups={categoryGroups}
        transactions={periodData.transactions}
      />
    </>
  )
}
