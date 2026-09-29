"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { filterTransactions } from "../_lib/filter-transactions"
import {
  getTransactionPeriod,
  shiftPeriodAnchor,
} from "../_lib/get-transaction-period"
import type {
  Transaction,
  TransactionFilter,
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
  selectedMonth: string
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
  selectedMonth,
  todayDateKey,
  transactions,
}: TransactionsDashboardProps) {
  const router = useRouter()
  const [isNavigating, startNavigation] = React.useTransition()
  const period = "month" as const
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const [searchFilters, setSearchFilters] =
    React.useState<TransactionSearchFilters>(initialSearchFilters)
  const effectiveAnchorDateKey = `${selectedMonth}-01`
  const periodData = React.useMemo(
    () =>
      getTransactionPeriod(
        transactions,
        period,
        effectiveAnchorDateKey,
        todayDateKey,
        todayDateKey,
      ),
    [effectiveAnchorDateKey, period, todayDateKey, transactions],
  )
  const previousPeriodTransactions = React.useMemo(
    () =>
      getTransactionPeriod(
        transactions,
        period,
        shiftPeriodAnchor(effectiveAnchorDateKey, period, -1),
        todayDateKey,
        todayDateKey,
      ).transactions,
    [effectiveAnchorDateKey, period, todayDateKey, transactions],
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
        rangeLabel={periodData.rangeLabel}
        contextLabel={periodData.contextLabel}
        transactionCount={visibleTransactions.length}
        canGoNext={!isNavigating && selectedMonth < todayDateKey.slice(0, 7)}
        onFilterChange={setFilter}
        onSearchFiltersChange={setSearchFilters}
        onPrevious={() => {
          const month = shiftPeriodAnchor(
            effectiveAnchorDateKey,
            period,
            -1,
          ).slice(0, 7)
          startNavigation(() => router.push(`/transactions?month=${month}`))
        }}
        onNext={() => {
          const month = shiftPeriodAnchor(
            effectiveAnchorDateKey,
            period,
            1,
          ).slice(0, 7)
          startNavigation(() =>
            router.push(
              month === todayDateKey.slice(0, 7)
                ? "/transactions"
                : `/transactions?month=${month}`,
            ),
          )
        }}
        onReset={() => {
          setFilter("all")
          setSearchFilters(initialSearchFilters)
          startNavigation(() => router.push("/transactions"))
        }}
      />
      <TransactionsView
        accounts={accounts}
        categoryGroups={categoryGroups}
        todayDateKey={todayDateKey}
        transactions={visibleTransactions}
      />
    </>
  )
}
