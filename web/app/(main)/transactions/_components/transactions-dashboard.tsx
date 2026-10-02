"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { AiAssistButton } from "@/components/ai-assist/ai-assist-button"
import { PageHeader } from "@/components/page"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { filterTransactions } from "../_lib/filter-transactions"
import { getTransactionPeriod } from "../_lib/get-transaction-period"
import type {
  Transaction,
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"
import { AddTransactionButton } from "./add-transaction-button"
import { AiTransactionSheet } from "./ai-transaction/ai-transaction-sheet"
import { TransactionHistoryProvider } from "./add-transaction/transaction-history-context"
import { TransactionFilterPanel } from "./transaction-filter-fields"
import { TransactionsHero } from "./transactions-hero"
import { TransactionsLayout } from "./transactions-layout"
import { TransactionsView } from "./transactions-view"
import { TransactionToolbar } from "./transaction-toolbar"

type TransactionsDashboardProps = {
  accounts: Account[]
  initialAccountId?: string
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
  initialAccountId,
  categoryGroups,
  selectedMonth,
  todayDateKey,
  transactions,
}: TransactionsDashboardProps) {
  const router = useRouter()
  const [isNavigating, startNavigation] = React.useTransition()
  const period = "month" as const
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const [aiOpen, setAiOpen] = React.useState(false)
  const [searchFilters, setSearchFilters] =
    React.useState<TransactionSearchFilters>(() => ({
      ...initialSearchFilters,
      accountIds: initialAccountId ? [initialAccountId] : [],
    }))
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
  const visibleTransactions = React.useMemo(
    () => filterTransactions(periodData.transactions, filter, searchFilters),
    [filter, periodData.transactions, searchFilters],
  )
  // Clears the filter conditions; the search text and month stay.
  const resetFilters = () => {
    setFilter("all")
    setSearchFilters({ ...initialSearchFilters, query: searchFilters.query })
  }

  return (
    <TransactionHistoryProvider transactions={transactions}>
      <PageHeader
        title="Giao dịch"
        actions={
          <>
            <AiAssistButton onClick={() => setAiOpen(true)}>Nhập bằng AI</AiAssistButton>
            <AddTransactionButton
              accounts={accounts}
              categoryGroups={categoryGroups}
            />
          </>
        }
      />
      <TransactionsLayout
        summary={
          <TransactionsHero
            transactions={periodData.transactions}
            rangeLabel={periodData.rangeLabel}
            selectedMonth={selectedMonth}
            maxMonth={todayDateKey.slice(0, 7)}
            isMonthPending={isNavigating}
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
          />
        }
        filters={
          <TransactionFilterPanel
            accounts={accounts}
            categoryGroups={categoryGroups}
            filter={filter}
            searchFilters={searchFilters}
            onFilterChange={setFilter}
            onSearchFiltersChange={setSearchFilters}
            onReset={resetFilters}
          />
        }
      >
        <TransactionToolbar
          accounts={accounts}
          categoryGroups={categoryGroups}
          filter={filter}
          searchFilters={searchFilters}
          transactionCount={visibleTransactions.length}
          onFilterChange={setFilter}
          onSearchFiltersChange={setSearchFilters}
          onReset={resetFilters}
        />
        <TransactionsView
          accounts={accounts}
          categoryGroups={categoryGroups}
          todayDateKey={todayDateKey}
          transactions={visibleTransactions}
        />
      </TransactionsLayout>
      {/* On mobile the action floats above the bottom nav so it stays within
          thumb reach while scrolling a long list. */}
      {/* The AI button sits above the add button, so the two stay within a
          phone's width. */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end md:hidden">
        <div className="pointer-events-auto flex flex-col items-end gap-4">
          <AiAssistButton onClick={() => setAiOpen(true)}>AI</AiAssistButton>
          <AddTransactionButton
            accounts={accounts}
            categoryGroups={categoryGroups}
          />
        </div>
      </div>
      <AiTransactionSheet
        open={aiOpen}
        onOpenChange={setAiOpen}
        accounts={accounts}
        categoryGroups={categoryGroups}
        todayDateKey={todayDateKey}
      />
    </TransactionHistoryProvider>
  )
}
