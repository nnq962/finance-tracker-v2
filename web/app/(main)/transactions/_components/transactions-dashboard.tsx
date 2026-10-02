"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { PageHeader } from "@/components/page"
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
import { TransactionHistoryProvider } from "./add-transaction/transaction-history-context"
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
    <TransactionHistoryProvider transactions={transactions}>
      <PageHeader
        title="Giao dịch"
        description="Theo dõi các khoản thu, chi và chuyển khoản của bạn."
        actions={
          <AddTransactionButton
            accounts={accounts}
            categoryGroups={categoryGroups}
          />
        }
      />
      <TransactionsHero
        categoryGroups={categoryGroups}
        period={period}
        previousTransactions={previousPeriodTransactions}
        rangeLabel={periodData.rangeLabel}
        transactions={periodData.transactions}
      />
      <TransactionToolbar
        accounts={accounts}
        categoryGroups={categoryGroups}
        filter={filter}
        searchFilters={searchFilters}
        selectedMonth={selectedMonth}
        maxMonth={todayDateKey.slice(0, 7)}
        isMonthPending={isNavigating}
        rangeLabel={periodData.rangeLabel}
        transactionCount={visibleTransactions.length}
        onFilterChange={setFilter}
        onSearchFiltersChange={setSearchFilters}
        onMonthChange={(month) => {
          startNavigation(() =>
            router.push(
              month === todayDateKey.slice(0, 7)
                ? "/transactions"
                : `/transactions?month=${month}`,
              { scroll: false },
            ),
          )
        }}
        onReset={() => {
          setFilter("all")
          setSearchFilters(initialSearchFilters)
          startNavigation(() => router.push("/transactions", { scroll: false }))
        }}
      />
      <TransactionsView
        accounts={accounts}
        categoryGroups={categoryGroups}
        todayDateKey={todayDateKey}
        transactions={visibleTransactions}
      />
      {/* On mobile the action floats above the bottom nav so it stays within
          thumb reach while scrolling a long list. */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end md:hidden">
        <div className="pointer-events-auto">
          <AddTransactionButton
            accounts={accounts}
            categoryGroups={categoryGroups}
          />
        </div>
      </div>
    </TransactionHistoryProvider>
  )
}
