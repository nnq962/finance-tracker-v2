"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AiAssistButton } from "@/components/ai-assist/ai-assist-button"
import { FloatingActions } from "@/components/app/floating-actions"
import { PageHeader } from "@/components/page"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { PurchaseDraft } from "@/lib/plans/purchase-draft"

import type { AiQuota } from "../actions"

import { filterTransactions } from "../_lib/filter-transactions"
import { getTransactionPeriod } from "../_lib/get-transaction-period"
import type {
  Transaction,
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"
import { AddTransactionButton } from "./add-transaction-button"
import { AddTransactionSheet } from "./add-transaction/add-transaction-sheet"
import { AiTransactionDrawer } from "./ai-transaction/ai-transaction-drawer"
import { NeedAccountState } from "./add-transaction/need-account-state"
import { TransactionHistoryProvider } from "./add-transaction/transaction-history-context"
import { countActiveFilters, TransactionFilterPanel } from "./transaction-filter-fields"
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
  /** This month's AI requests, the plan's limit and AI credits, as the page loaded. */
  aiQuota: AiQuota
  /** Opens the AI assistant straight away. */
  initialAiOpen?: boolean
  /** A Pro purchase to write down, opened from the plan screen or an admin's sale notice. */
  purchaseDraft?: PurchaseDraft
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
  aiQuota: initialAiQuota,
  initialAiOpen = false,
  purchaseDraft,
}: TransactionsDashboardProps) {
  const router = useRouter()
  const [isNavigating, startNavigation] = React.useTransition()
  const period = "month" as const
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const hasAccount = accounts.some((account) => account.status === "active")
  const [aiOpen, setAiOpen] = React.useState(initialAiOpen && hasAccount)
  // Without an account the AI could not save what it reads, so it asks for one first.
  const [needAccountOpen, setNeedAccountOpen] = React.useState(initialAiOpen && !hasAccount)
  // Kept after the link's address is cleared, so the sheet stays filled in.
  const [draft] = React.useState(purchaseDraft)
  const [draftOpen, setDraftOpen] = React.useState(Boolean(purchaseDraft && !purchaseDraft.recorded))
  const draftHandled = React.useRef(false)
  React.useEffect(() => {
    if (!draft || draftHandled.current) return
    draftHandled.current = true
    if (draft.recorded) toast.info("Khoản này đã được ghi.")
    // Reloading the page should not open the draft again.
    window.history.replaceState(null, "", "/transactions")
  }, [draft])
  const openAi = () => (hasAccount ? setAiOpen(true) : setNeedAccountOpen(true))
  // Follows each request's answer, which carries the count after it.
  const [aiQuota, setAiQuota] = React.useState(initialAiQuota)
  const aiMonthRemaining = Math.max(0, aiQuota.limit - aiQuota.used)
  // Credits from missions count once the month's requests are used up.
  const aiRemaining = aiMonthRemaining + aiQuota.credits
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
  // From an empty result: the search goes too.
  const clearFilters = () => {
    setFilter("all")
    setSearchFilters(initialSearchFilters)
  }
  const isFiltering =
    countActiveFilters(filter, searchFilters) > 0 || searchFilters.query.trim() !== ""

  return (
    <TransactionHistoryProvider transactions={transactions}>
      <PageHeader
        title="Giao dịch"
        actions={
          <>
            <AiAssistButton variant="grape" remaining={aiRemaining} onClick={openAi}>
              Nhập bằng AI
            </AiAssistButton>
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
          isFiltering={isFiltering}
          onClearFilters={clearFilters}
        />
      </TransactionsLayout>
      {/* The AI button sits above the add button, so the two stay within a
          phone's width. */}
      <FloatingActions>
        <AiAssistButton variant="grape" remaining={aiRemaining} onClick={openAi}>
          AI
        </AiAssistButton>
        <AddTransactionButton
          accounts={accounts}
          categoryGroups={categoryGroups}
        />
      </FloatingActions>
      <Sheet open={needAccountOpen && !hasAccount} onOpenChange={setNeedAccountOpen}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader title="Nhập bằng AI" />
          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-4 pb-8">
            <NeedAccountState />
          </div>
        </SheetContent>
      </Sheet>
      {draft && !draft.recorded ? (
        <AddTransactionSheet
          accounts={accounts}
          categoryGroups={categoryGroups}
          draft={draft}
          open={draftOpen}
          onOpenChange={setDraftOpen}
        />
      ) : null}
      <AiTransactionDrawer
        open={aiOpen}
        onOpenChange={setAiOpen}
        accounts={accounts}
        categoryGroups={categoryGroups}
        todayDateKey={todayDateKey}
        quota={{ remaining: aiMonthRemaining, limit: aiQuota.limit, credits: aiQuota.credits }}
        onQuotaChange={setAiQuota}
      />
    </TransactionHistoryProvider>
  )
}
