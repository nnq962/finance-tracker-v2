"use client"

import * as React from "react"

import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { filterTransactions } from "../_lib/filter-transactions"
import {
  getLatestTransactionDateKey,
  getTransactionPeriod,
  shiftPeriodAnchor,
} from "../_lib/get-transaction-period"
import type {
  Transaction,
  TransactionFilter,
  TransactionPeriod,
  TransactionSearchFilters,
} from "../_types/transaction"
import { AddTransactionButton } from "./add-transaction-button"
import { TransactionsHeader } from "./transactions-header"
import { TransactionsHero } from "./transactions-hero"
import { TransactionsView } from "./transactions-view"
import { TransactionToolbar } from "./transaction-toolbar"

type TransactionsDashboardProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transactions: Transaction[]
}

const initialSearchFilters: TransactionSearchFilters = {
  query: "",
  minAmount: null,
  maxAmount: null,
  accountIds: [],
  categoryGroupIds: [],
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
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const [searchFilters, setSearchFilters] =
    React.useState<TransactionSearchFilters>(initialSearchFilters)
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
  const previousPeriodTransactions = React.useMemo(
    () =>
      getTransactionPeriod(
        transactions,
        period,
        shiftPeriodAnchor(effectiveAnchorDateKey, period, -1),
        latestDateKey,
      ).transactions,
    [effectiveAnchorDateKey, latestDateKey, period, transactions],
  )
  const visibleTransactions = React.useMemo(
    () => filterTransactions(periodData.transactions, filter, searchFilters),
    [filter, periodData.transactions, searchFilters],
  )

  return (
    <>
      <TransactionsHeader>
        <AddTransactionButton
          accounts={accounts}
          categoryGroups={categoryGroups}
        />
      </TransactionsHeader>
      <TransactionsHero
        categoryGroups={categoryGroups}
        period={period}
        previousTransactions={previousPeriodTransactions}
        transactions={periodData.transactions}
      />
      <TransactionToolbar
        accounts={accounts}
        categoryGroups={categoryGroups}
        filter={filter}
        searchFilters={searchFilters}
        period={period}
        rangeLabel={periodData.rangeLabel}
        contextLabel={periodData.contextLabel}
        transactionCount={visibleTransactions.length}
        canGoNext={!periodData.isCurrent}
        onFilterChange={setFilter}
        onSearchFiltersChange={setSearchFilters}
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
        onReset={() => {
          setAnchorDateKey(latestDateKey)
          setFilter("all")
          setSearchFilters(initialSearchFilters)
        }}
      />
      <TransactionsView
        accounts={accounts}
        categoryGroups={categoryGroups}
        transactions={visibleTransactions}
      />
    </>
  )
}
