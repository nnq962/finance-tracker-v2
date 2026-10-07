"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { ListFilterIcon, PlusIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { AiAssistButton } from "@/components/ai-assist/ai-assist-button"
import { FloatingActions } from "@/components/app/floating-actions"
import { MonthTabs } from "@/components/app/month-tabs"
import { PageHeader } from "@/components/page"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { cn } from "@/lib/utils"
import type { PurchaseDraft } from "@/lib/plans/purchase-draft"

import type { AiQuota } from "../actions"

import { filterTransactions } from "../_lib/filter-transactions"
import { getTransactionPeriod } from "../_lib/get-transaction-period"
import type { Transaction, TransactionFilter, TransactionSearchFilters } from "../_types/transaction"
import { AddTransactionButton } from "./add-transaction-button"
import { AddTransactionSheet } from "./add-transaction/add-transaction-sheet"
import { AiTransactionDrawer } from "./ai-transaction/ai-transaction-drawer"
import { NeedAccountState } from "./add-transaction/need-account-state"
import { TransactionHistoryProvider } from "./add-transaction/transaction-history-context"
import { MonthSummary } from "./month-summary"
import { countActiveFilters, filtersForKind, TransactionFilterPanel } from "./transaction-filter-fields"
import { countSheetFilters, TransactionFilterSheet, TransactionSearchBar } from "./transaction-search"
import { TransactionsLayout } from "./transactions-layout"
import { TransactionsView } from "./transactions-view"

type TransactionsScreenProps = {
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

/**
 * The transactions page, as in banking apps: the months as tabs, the month's
 * totals, a switch for all, spending or income, then the days. On phones the
 * search takes the title's place and the other filters (kind, category,
 * account, amount) open in a sheet; the totals follow all of them. A tapped
 * month is chosen at once and the list stays put, dimmed, until it loads.
 */
export function TransactionsScreen({
  accounts,
  initialAccountId,
  categoryGroups,
  selectedMonth,
  todayDateKey,
  transactions,
  aiQuota: initialAiQuota,
  initialAiOpen = false,
  purchaseDraft,
}: TransactionsScreenProps) {
  const router = useRouter()
  // The page's own address, so the preview keeps to itself while it is reviewed.
  const pathname = usePathname()
  const [isNavigating, startNavigation] = React.useTransition()
  const thisMonth = todayDateKey.slice(0, 7)
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const [searchFilters, setSearchFilters] = React.useState<TransactionSearchFilters>(() => ({
    ...initialSearchFilters,
    accountIds: initialAccountId ? [initialAccountId] : [],
  }))
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  // The month tapped, shown on the tabs while it loads.
  const [requestedMonth, setRequestedMonth] = React.useState(selectedMonth)

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
    window.history.replaceState(null, "", pathname)
  }, [draft, pathname])
  const openAi = () => (hasAccount ? setAiOpen(true) : setNeedAccountOpen(true))
  // Follows each request's answer, which carries the count after it.
  const [aiQuota, setAiQuota] = React.useState(initialAiQuota)
  const aiMonthRemaining = Math.max(0, aiQuota.limit - aiQuota.used)
  // Credits from missions count once the month's requests are used up.
  const aiRemaining = aiMonthRemaining + aiQuota.credits

  const monthTransactions = React.useMemo(
    () => getTransactionPeriod(transactions, "month", `${selectedMonth}-01`, todayDateKey, todayDateKey).transactions,
    [selectedMonth, todayDateKey, transactions],
  )
  const visibleTransactions = React.useMemo(
    () => filterTransactions(monthTransactions, filter, searchFilters),
    [filter, monthTransactions, searchFilters],
  )

  const changeKind = (kind: TransactionFilter) => {
    setFilter(kind)
    const narrowed = filtersForKind(kind, searchFilters, categoryGroups)
    if (narrowed !== searchFilters) setSearchFilters(narrowed)
  }
  const changeQuery = (query: string) => setSearchFilters({ ...searchFilters, query })
  // Clears the filter conditions; the search text and month stay.
  const resetFilters = () => {
    setFilter("all")
    setSearchFilters({ ...initialSearchFilters, query: searchFilters.query })
  }
  // From an empty result: the search goes too.
  const clearFilters = () => {
    setFilter("all")
    setSearchFilters(initialSearchFilters)
    setSearchOpen(false)
  }
  const isFiltering = countActiveFilters(filter, searchFilters) > 0 || searchFilters.query.trim() !== ""
  const sheetFilterCount = countSheetFilters(filter, searchFilters)
  const showSearch = searchOpen || searchFilters.query !== ""

  const changeMonth = (month: string) => {
    setRequestedMonth(month)
    startNavigation(() => router.push(month === thisMonth ? pathname : `${pathname}?month=${month}`, { scroll: false }))
  }
  // While a month loads, what is shown stays and dims.
  const loadingClassName = cn("transition-opacity duration-200", isNavigating && "opacity-50")

  return (
    <TransactionHistoryProvider transactions={transactions}>
      <PageHeader
        title="Giao dịch"
        actions={
          <>
            <AiAssistButton variant="outline" remaining={aiRemaining} onClick={openAi}>
              Nhập bằng AI
            </AiAssistButton>
            <AddTransactionButton accounts={accounts} categoryGroups={categoryGroups} />
          </>
        }
        replacement={
          showSearch ? (
            <TransactionSearchBar
              id="transaction-search-phone"
              query={searchFilters.query}
              onQueryChange={changeQuery}
              autoFocus={searchOpen}
              onCancel={() => {
                changeQuery("")
                setSearchOpen(false)
              }}
            />
          ) : undefined
        }
        accessory={
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Tìm giao dịch"
              aria-pressed={showSearch}
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="relative"
              aria-label={sheetFilterCount > 0 ? `Bộ lọc, ${sheetFilterCount} điều kiện` : "Bộ lọc"}
              onClick={() => setFilterOpen(true)}
            >
              <ListFilterIcon />
              {sheetFilterCount > 0 ? (
                <Badge variant="count" className="absolute -top-1 -right-1">
                  {sheetFilterCount}
                </Badge>
              ) : null}
            </Button>
          </>
        }
      />

      <TransactionsLayout
        summary={
          <div className="flex flex-col gap-3">
            <MonthTabs
              value={isNavigating ? requestedMonth : selectedMonth}
              max={thisMonth}
              pending={isNavigating}
              onValueChange={changeMonth}
            />
            <MonthSummary transactions={visibleTransactions} className={loadingClassName} />
          </div>
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
        {/* From lg up the search stays above the list, beside the filters. */}
        <div className="hidden lg:block">
          <TransactionSearchBar id="transaction-search" query={searchFilters.query} onQueryChange={changeQuery} />
        </div>
        {/* The other kinds and every other filter are in the sheet, or beside the list from lg up. */}
        <div className="flex flex-col gap-3 lg:hidden">
          <Tabs value={filter} onValueChange={(value) => changeKind(value as TransactionFilter)}>
            <TabsList className="w-full" aria-label="Lọc loại giao dịch">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="expense">Chi</TabsTrigger>
              <TabsTrigger value="income">Thu</TabsTrigger>
            </TabsList>
          </Tabs>
          {isFiltering ? (
            <p className="px-1 text-sm text-muted-foreground" aria-live="polite">
              {visibleTransactions.length} giao dịch
            </p>
          ) : null}
        </div>
        <div className={loadingClassName}>
          <TransactionsView
            accounts={accounts}
            categoryGroups={categoryGroups}
            todayDateKey={todayDateKey}
            transactions={visibleTransactions}
            isFiltering={isFiltering}
            onClearFilters={clearFilters}
          />
        </div>
      </TransactionsLayout>

      <FloatingActions>
        <AiAssistButton
          variant="secondary"
          size="fab"
          className="text-ai"
          aria-label={`Nhập bằng AI, còn ${aiRemaining} lượt`}
          onClick={openAi}
        >
          {null}
        </AiAssistButton>
        <Button type="button" size="fab" aria-label="Thêm giao dịch" onClick={() => setAddOpen(true)}>
          <PlusIcon />
        </Button>
      </FloatingActions>

      <AddTransactionSheet accounts={accounts} categoryGroups={categoryGroups} open={addOpen} onOpenChange={setAddOpen} />
      <TransactionFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        accounts={accounts}
        categoryGroups={categoryGroups}
        filter={filter}
        searchFilters={searchFilters}
        transactionCount={visibleTransactions.length}
        onFilterChange={changeKind}
        onSearchFiltersChange={setSearchFilters}
        onReset={resetFilters}
      />
      <Sheet open={needAccountOpen && !hasAccount} onOpenChange={setNeedAccountOpen}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          variant="screen"
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
