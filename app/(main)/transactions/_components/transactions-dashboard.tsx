"use client"

import * as React from "react"

import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { filterTransactions } from "../_lib/filter-transactions"
import {
  getLastNavigableDateKey,
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
  todayDateKey: string
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
  todayDateKey,
  transactions,
}: TransactionsDashboardProps) {
  const lastNavigableDateKey = React.useMemo(
    () => getLastNavigableDateKey(transactions, todayDateKey),
    [transactions, todayDateKey],
  )
  const [period, setPeriod] = React.useState<TransactionPeriod>("month")
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const [searchFilters, setSearchFilters] =
    React.useState<TransactionSearchFilters>(initialSearchFilters)
  const [anchorDateKey, setAnchorDateKey] = React.useState<string | null>(null)
  const effectiveAnchorDateKey = anchorDateKey ?? todayDateKey
  const periodData = React.useMemo(
    () =>
      getTransactionPeriod(
        transactions,
        period,
        effectiveAnchorDateKey,
        todayDateKey,
        lastNavigableDateKey,
      ),
    [effectiveAnchorDateKey, lastNavigableDateKey, period, todayDateKey, transactions],
  )
  const previousPeriodTransactions = React.useMemo(
    () =>
      getTransactionPeriod(
        transactions,
        period,
        shiftPeriodAnchor(effectiveAnchorDateKey, period, -1),
        todayDateKey,
        lastNavigableDateKey,
      ).transactions,
    [effectiveAnchorDateKey, lastNavigableDateKey, period, todayDateKey, transactions],
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
        canGoNext={!periodData.isLatest}
        onFilterChange={setFilter}
        onSearchFiltersChange={setSearchFilters}
        onPeriodChange={(nextPeriod) => {
          setPeriod(nextPeriod)
          setAnchorDateKey(null)
        }}
        onPrevious={() =>
          setAnchorDateKey(shiftPeriodAnchor(effectiveAnchorDateKey, period, -1))
        }
        onNext={() => {
          const nextDateKey = shiftPeriodAnchor(effectiveAnchorDateKey, period, 1)
          const nextPeriod = getTransactionPeriod(
            transactions,
            period,
            nextDateKey,
            todayDateKey,
            lastNavigableDateKey,
          )
          setAnchorDateKey(nextPeriod.isCurrent ? null : nextDateKey)
        }}
        onReset={() => {
          setAnchorDateKey(null)
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
