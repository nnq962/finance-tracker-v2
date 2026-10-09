"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { AiAssistButton } from "@/components/ai-assist/ai-assist-button"
import { Collapse } from "@/components/app/collapse"
import { FloatingActions } from "@/components/app/floating-actions"
import { MonthSelect } from "@/components/app/month-select"
import { PageSheet } from "@/components/app/page-sheet"
import { PageHeader } from "@/components/page"
import { Button } from "@/components/ui/button"
import { appEvents, listenToAppEvent } from "@/lib/app-events"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { cn } from "@/lib/utils"
import type { PurchaseDraft } from "@/lib/plans/purchase-draft"

import { loadAllTransactionsAction, type AiQuota } from "../actions"

import { filterTransactions } from "../_lib/filter-transactions"
import { getTransactionPeriod } from "../_lib/get-transaction-period"
import type { Transaction, TransactionFilter, TransactionSearchFilters } from "../_types/transaction"
import { AddTransactionButton } from "./add-transaction-button"
import { AddTransactionSheet } from "./add-transaction/add-transaction-sheet"
import { AiTransactionDrawer } from "./ai-transaction/ai-transaction-drawer"
import { NeedAccountState } from "./add-transaction/need-account-state"
import { TransactionHistoryProvider } from "./add-transaction/transaction-history-context"
import { MonthSummary } from "./month-summary"
import { getSheetFilterChips, TransactionActiveFilters } from "./transaction-active-filters"
import {
  countActiveFilters,
  filtersForKind,
  TransactionFilterPanel,
  transactionKindOptions,
} from "./transaction-filter-fields"
import { TransactionKindChips } from "./transaction-kind-chips"
import type { TransactionSearchResults } from "./transaction-list"
import { TransactionFilterSheet } from "./transaction-filter-sheet"
import { countSheetFilters, TransactionSearchBar } from "./transaction-search"
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
  /** Opened from a reminder to write something down. */
  initialAddOpen?: boolean
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
 * The transactions page, as in banking apps: the month as a pill in the bar
 * (a tap changes it), then its money in and money out as one card, then the
 * days, each day's caption staying at the top while its rows scroll. On
 * phones the AI sits in the bar too and adding is the one floating button;
 * under the card come the search field and a chip row: the filter chip for
 * the other conditions (category, account, amount), then the kinds. A tap on
 * the search field opens the search screen: the bar, card, tab bar and
 * floating button make way, Huỷ closes it. Results list as one, the match
 * marked, and can be widened to every month. A month chosen loads while the
 * list stays put, dimmed.
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
  initialAddOpen = false,
  purchaseDraft,
}: TransactionsScreenProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, startNavigation] = React.useTransition()
  const thisMonth = todayDateKey.slice(0, 7)
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const [searchFilters, setSearchFilters] = React.useState<TransactionSearchFilters>(() => ({
    ...initialSearchFilters,
    accountIds: initialAccountId ? [initialAccountId] : [],
  }))
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(initialAddOpen)
  // A reminder tapped while this page is shown opens the sheet here.
  React.useEffect(() => listenToAppEvent(appEvents.addTransaction, () => setAddOpen(true)), [])
  // Reloading the page should not open the sheet again.
  React.useEffect(() => {
    if (initialAddOpen) window.history.replaceState(null, "", window.location.pathname)
  }, [initialAddOpen])
  // The month tapped, shown on the tabs while it loads.
  const [requestedMonth, setRequestedMonth] = React.useState(selectedMonth)
  // The phone's search screen, open from a tap on the field until Huỷ.
  const [searching, setSearching] = React.useState(false)
  // Searching every month: loaded on request, for the transactions the page
  // had then, so a change to them (one added, edited) loads them again.
  const [allMonths, setAllMonths] = React.useState(false)
  const [everyMonth, setEveryMonth] = React.useState<{ from: Transaction[]; list: Transaction[] }>()
  const [isLoadingAll, startLoadingAll] = React.useTransition()
  const everyTransaction = everyMonth?.from === transactions ? everyMonth.list : undefined
  React.useEffect(() => {
    if (!allMonths || everyTransaction) return
    startLoadingAll(async () => {
      const list = await loadAllTransactionsAction()
      setEveryMonth({ from: transactions, list })
    })
  }, [allMonths, everyTransaction, transactions])

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
  // The list follows the filters a moment behind them: a tap on a chip
  // paints the chip at once, then the list (dozens of rows) renders in the
  // background, so the chip never waits on it mid-change.
  const listFilter = React.useDeferredValue(filter)
  const listSearchFilters = React.useDeferredValue(searchFilters)
  const visibleTransactions = React.useMemo(
    () =>
      filterTransactions(allMonths ? (everyTransaction ?? []) : monthTransactions, listFilter, listSearchFilters),
    [allMonths, everyTransaction, listFilter, monthTransactions, listSearchFilters],
  )
  // Every filter but the kind, for the tiles: the kind is what they switch.
  const summaryTransactions = React.useMemo(
    () => filterTransactions(monthTransactions, "all", searchFilters),
    [monthTransactions, searchFilters],
  )

  const changeKind = (kind: TransactionFilter) => {
    setFilter(kind)
    const narrowed = filtersForKind(kind, searchFilters, categoryGroups)
    if (narrowed !== searchFilters) setSearchFilters(narrowed)
  }
  const changeQuery = (query: string) => {
    setSearchFilters({ ...searchFilters, query })
    // Every month is for one search; a new one starts in the chosen month.
    if (!query.trim()) setAllMonths(false)
  }
  // Clears the filter conditions; the search text and month stay.
  const resetFilters = () => {
    setFilter("all")
    setSearchFilters({ ...initialSearchFilters, query: searchFilters.query })
  }
  // From an empty result: the search goes too. Setters only, so the list,
  // which is memoised, can keep it.
  const clearFilters = React.useCallback(() => {
    setFilter("all")
    setSearchFilters(initialSearchFilters)
  }, [])
  // Clears the sheet's conditions; the kind and search stay.
  const resetSheetFilters = React.useCallback(
    () => setSearchFilters((current) => ({ ...initialSearchFilters, query: current.query })),
    [],
  )
  const isFiltering =
    countActiveFilters(listFilter, listSearchFilters) > 0 || listSearchFilters.query.trim() !== ""
  const sheetFilterCount = countSheetFilters(filter, searchFilters)

  const openSearch = () => {
    // Only phones have a search screen; from lg up the field sits beside the list.
    if (searching || !window.matchMedia("(width < 64rem)").matches) return
    setSearching(true)
    document.querySelector("[data-main-scroll-viewport]")?.scrollTo({ top: 0 })
  }
  const closeSearch = () => {
    setSearching(false)
    setAllMonths(false)
    changeQuery("")
  }
  const loadingAll = allMonths && !everyTransaction && isLoadingAll
  const search = React.useMemo<TransactionSearchResults | undefined>(() => {
    if (!listSearchFilters.query.trim()) return undefined
    const year = selectedMonth.slice(0, 4)
    return {
      query: listSearchFilters.query,
      scopeLabel: allMonths
        ? "mọi tháng"
        : `Tháng ${Number(selectedMonth.slice(5))}${year === thisMonth.slice(0, 4) ? "" : `/${year}`}`,
      onSearchAllMonths: allMonths ? undefined : () => setAllMonths(true),
      loading: loadingAll,
      filterLabels: [
        ...transactionKindOptions.filter((item) => item.value !== "all" && item.value === listFilter).map((item) => item.label),
        ...getSheetFilterChips(accounts, categoryGroups, listSearchFilters).map((chip) => chip.label),
      ],
      onClearFilters: () => {
        setFilter("all")
        resetSheetFilters()
      },
    }
  }, [accounts, allMonths, categoryGroups, listFilter, listSearchFilters, loadingAll, resetSheetFilters, selectedMonth, thisMonth])

  const changeMonth = (month: string) => {
    setRequestedMonth(month)
    startNavigation(() => router.push(month === thisMonth ? pathname : `${pathname}?month=${month}`, { scroll: false }))
  }
  const shownMonth = isNavigating ? requestedMonth : selectedMonth
  const headerActions = (
    <>
      {/* On tablets the sparkle and count only, as the row is short of room. */}
      <AiAssistButton variant="outline" remaining={aiRemaining} onClick={openAi}>
        <span className="md:max-lg:sr-only">Nhập bằng AI</span>
      </AiAssistButton>
      <AddTransactionButton accounts={accounts} categoryGroups={categoryGroups} />
    </>
  )
  // While a month loads, what is shown stays and dims.
  const loadingClassName = cn("transition-opacity duration-200", isNavigating && "opacity-50")

  return (
    <TransactionHistoryProvider transactions={transactions}>
      {/* Searching on a phone the field takes the top, and the tab bar makes way. */}
      {searching ? <div data-hide-tab-bar hidden /> : null}
      {/* Folds away while searching, so the field slides up to the top. */}
      {/* Its own space below goes with it, from md up too (the page's gap). */}
      <Collapse open={!searching} className={searching ? "mb-0" : "max-md:mb-0"}>
        <PageHeader
          title="Giao dịch"
          tools={<MonthSelect size="bar" value={shownMonth} max={thisMonth} onValueChange={changeMonth} />}
          actions={headerActions}
          accessory={
            <AiAssistButton
              variant="secondary"
              size="icon"
              className="text-ai-strong"
              aria-label={`Nhập bằng AI, còn ${aiRemaining} lượt`}
              onClick={openAi}
            >
              {null}
            </AiAssistButton>
          }
        />
      </Collapse>

      <TransactionsLayout
        listOnly={searching}
        summary={<MonthSummary transactions={summaryTransactions} className={loadingClassName} />}
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
        {/* Under the card on phones, above the list beside the filter panel from lg up. */}
        <div className="flex flex-col gap-3">
          <TransactionSearchBar
            id="transaction-search"
            query={searchFilters.query}
            onQueryChange={changeQuery}
            onFocus={openSearch}
            onCancel={closeSearch}
            cancelable={searching}
          />
          {/* From lg up the filter panel beside the list holds these. */}
          <TransactionKindChips
            className="lg:hidden"
            filter={filter}
            onFilterChange={changeKind}
            sheetFilterCount={sheetFilterCount}
            onOpenFilters={() => setFilterOpen(true)}
          />
          <TransactionActiveFilters
            className="lg:hidden"
            accounts={accounts}
            categoryGroups={categoryGroups}
            searchFilters={searchFilters}
            onSearchFiltersChange={setSearchFilters}
          />
        </div>
        <div className={loadingClassName}>
          <TransactionsView
            accounts={accounts}
            categoryGroups={categoryGroups}
            todayDateKey={todayDateKey}
            transactions={visibleTransactions}
            isFiltering={isFiltering}
            onClearFilters={clearFilters}
            search={search}
          />
        </div>
      </TransactionsLayout>

      <FloatingActions concealed={searching}>
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
        onSearchFiltersChange={setSearchFilters}
        onReset={resetSheetFilters}
      />
      <PageSheet title="Nhập bằng AI" open={needAccountOpen && !hasAccount} onOpenChange={setNeedAccountOpen}>
        <div className="flex flex-1 flex-col justify-center pb-8">
          <NeedAccountState />
        </div>
      </PageSheet>
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
