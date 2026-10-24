"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { ListFilterIcon, PlusIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { Collapse } from "@/components/app/collapse"
import { FloatingActions } from "@/components/app/floating-actions"
import { BudgetProvider } from "@/components/budgets/budget-hint"
import { PageHeader } from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { appEvents, listenToAppEvent } from "@/lib/app-events"
import { useDeletedKeys } from "@/lib/undoable-delete"
import type { Account } from "@/lib/accounts/types"
import type { BudgetOverview } from "@/lib/budgets/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { cn } from "@/lib/utils"
import type { PurchaseDraft } from "@/lib/plans/purchase-draft"

import { loadAllTransactionsAction } from "../actions"

import { filterTransactions } from "../_lib/filter-transactions"
import { getTransactionPeriod } from "../_lib/get-transaction-period"
import { getTransactionSummary } from "../_lib/get-transaction-summary"
import { toDateKey } from "@/lib/format-date"
import { forFigures } from "@/lib/transactions/types"
import type { Transaction, TransactionFilter, TransactionSearchFilters } from "../_types/transaction"
import { AddTransactionButton } from "./add-transaction-button"
import { AddTransactionSheet } from "./add-transaction/add-transaction-sheet"
import { transactionDeleteKey } from "./delete-transaction"
import { TransactionHistoryProvider } from "./add-transaction/transaction-history-context"
import { SearchHistory } from "./search-history"
import { useSearchHistory } from "../_lib/search-history"
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
  /** Start filtered to these category groups (from a spending limit). */
  initialGroupIds?: string[]
  categoryGroups: CategoryGroup[]
  selectedMonth: string
  todayDateKey: string
  transactions: Transaction[]
  /** Opened from a reminder to write something down. */
  initialAddOpen?: boolean
  /** A Pro purchase to write down, opened from the plan screen or an admin's sale notice. */
  purchaseDraft?: PurchaseDraft
  /** This month's spending limits. */
  budgets: BudgetOverview
  /** Giao dịch | Vay nợ, in the bar where the page's name was. */
  viewSwitch?: React.ReactNode
}

/** "Tháng 9", with the year when it is not this one's: "Tháng 1/2025". */
function monthLabelOf(month: string, thisMonth: string) {
  const year = month.slice(0, 4)
  return `Tháng ${Number(month.slice(5))}${year === thisMonth.slice(0, 4) ? "" : `/${year}`}`
}

/** The list without what is being deleted. */
function withoutDeleted(list: Transaction[], deletedKeys: ReadonlySet<string>) {
  return deletedKeys.size ? list.filter((transaction) => !deletedKeys.has(transactionDeleteKey(transaction.id))) : list
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
// From lg up the search field always shows, beside the list.
const wideQuery = "(width >= 64rem)"
function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(wideQuery)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

export function TransactionsScreen({
  accounts,
  initialAccountId,
  initialGroupIds = [],
  categoryGroups,
  selectedMonth,
  todayDateKey,
  transactions,
  initialAddOpen = false,
  purchaseDraft,
  budgets,
  viewSwitch,
}: TransactionsScreenProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, startNavigation] = React.useTransition()
  const thisMonth = todayDateKey.slice(0, 7)
  const [filter, setFilter] = React.useState<TransactionFilter>("all")
  const [searchFilters, setSearchFilters] = React.useState<TransactionSearchFilters>(() => ({
    ...initialSearchFilters,
    accountIds: initialAccountId ? [initialAccountId] : [],
    categoryGroupIds: initialGroupIds,
  }))
  // A limit's "Xem tất cả" while this page is open: its groups filter the list.
  const groupKey = initialGroupIds.join()
  const [seenGroupKey, setSeenGroupKey] = React.useState(groupKey)
  if (groupKey !== seenGroupKey) {
    setSeenGroupKey(groupKey)
    if (groupKey) setSearchFilters((current) => ({ ...current, categoryGroupIds: initialGroupIds }))
  }
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
  const searchRef = React.useRef<{ open: () => void }>(null)
  // The searches done here, offered on the search screen before anything is typed.
  const searchHistory = useSearchHistory()
  // The day a bar of the card's chart was tapped for: the list scrolls to it and its badge is inked.
  const [focusDay, setFocusDay] = React.useState<string | null>(null)
  const wide = React.useSyncExternalStore(subscribeWide, () => window.matchMedia(wideQuery).matches, () => false)
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

  // A transaction being deleted leaves the list, the tiles and the days at
  // once, while its undo waits (it comes back if undone or if deleting fails).
  const deletedKeys = useDeletedKeys()
  const shownTransactions = React.useMemo(() => withoutDeleted(transactions, deletedKeys), [transactions, deletedKeys])
  const monthTransactions = React.useMemo(
    () => getTransactionPeriod(shownTransactions, "month", `${selectedMonth}-01`, todayDateKey, todayDateKey).transactions,
    [selectedMonth, todayDateKey, shownTransactions],
  )
  // The list follows the filters a moment behind them: a tap on a chip
  // paints the chip at once, then the list (dozens of rows) renders in the
  // background, so the chip never waits on it mid-change.
  const listFilter = React.useDeferredValue(filter)
  const listSearchFilters = React.useDeferredValue(searchFilters)
  const visibleTransactions = React.useMemo(
    () =>
      filterTransactions(
        allMonths ? withoutDeleted(everyTransaction ?? [], deletedKeys) : monthTransactions,
        listFilter,
        listSearchFilters,
      ),
    [allMonths, deletedKeys, everyTransaction, listFilter, monthTransactions, listSearchFilters],
  )
  // Every filter but the kind, for the tiles: the kind is what they switch.
  // Fees and interest are filtered as rows of their own (forFigures first),
  // so a fee goes with the account that paid it and its own amount.
  const summaryTransactions = React.useMemo(
    () => filterTransactions(forFigures(monthTransactions), "all", searchFilters),
    [monthTransactions, searchFilters],
  )
  // Each day's figures the same way, so a day's header keeps them while a kind is chosen.
  const dayTotals = React.useMemo(() => {
    const byDay = new Map<string, Transaction[]>()
    for (const transaction of summaryTransactions) {
      const key = toDateKey(transaction.occurredAt)
      byDay.set(key, [...(byDay.get(key) ?? []), transaction])
    }
    return Object.fromEntries([...byDay].map(([key, rows]) => [key, getTransactionSummary(rows)]))
  }, [summaryTransactions])

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
    // Huỷ ends a search: what was looked for is kept to look for again.
    searchHistory.add(searchFilters.query)
    setSearching(false)
    setAllMonths(false)
    changeQuery("")
  }
  const loadingAll = allMonths && !everyTransaction && isLoadingAll
  const search = React.useMemo<TransactionSearchResults | undefined>(() => {
    if (!listSearchFilters.query.trim()) return undefined
    return {
      query: listSearchFilters.query,
      scopeLabel: allMonths ? "mọi tháng" : monthLabelOf(selectedMonth, thisMonth),
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
    setFocusDay(null)
    startNavigation(() => router.push(month === thisMonth ? pathname : `${pathname}?month=${month}`, { scroll: false }))
  }
  const shownMonth = isNavigating ? requestedMonth : selectedMonth
  // Writing down by AI is Timi's, opened from the tab bar or the header (2026-10-12).
  const headerActions = <AddTransactionButton accounts={accounts} categoryGroups={categoryGroups} />
  // A bar of the card's chart: the list goes to that day, under its pinned caption.
  const goToDay = (dateKey: string) => {
    setFocusDay(dateKey)
    document.querySelector(`[data-day="${dateKey}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const openAdd = React.useCallback(() => setAddOpen(true), [])
  // Phones' tools beside the titles (2026-10-24): search and the filter sheet as round buttons;
  // from lg up the field and the filter panel sit beside the list instead.
  const headerTools = (
    <>
      <Button type="button" variant="elevated" size="icon" aria-label="Tìm giao dịch" className="lg:hidden" onClick={() => searchRef.current?.open()}>
        <SearchIcon />
      </Button>
      <Button
        type="button"
        variant={sheetFilterCount > 0 ? "default" : "elevated"}
        size="icon"
        aria-label={sheetFilterCount > 0 ? `Bộ lọc, ${sheetFilterCount} điều kiện` : "Bộ lọc"}
        className="relative lg:hidden"
        onClick={() => setFilterOpen(true)}
      >
        <ListFilterIcon />
        {sheetFilterCount > 0 ? (
          <Badge variant="count" aria-hidden="true" className="absolute top-0 left-[calc(50%+6px)]">
            {sheetFilterCount}
          </Badge>
        ) : null}
      </Button>
    </>
  )

  // While a month loads, what is shown stays and dims.
  const loadingClassName = cn("transition-opacity duration-200", isNavigating && "opacity-50")

  return (
    <BudgetProvider overview={budgets}>
    <TransactionHistoryProvider transactions={shownTransactions}>
      {/* Searching on a phone the field takes the top, and the tab bar makes way. */}
      {searching ? <div data-hide-tab-bar hidden /> : null}
      {/* Folds away while searching, so the field slides up to the top. */}
      {/* Its space below is its own (the row's 16 on phones, 16 above the content from md). */}
      <Collapse open={!searching} className="mb-0">
        <PageHeader
          title="Giao dịch"
          bare
          lead={viewSwitch}
          tools={headerTools}
          actions={headerActions}
        />
      </Collapse>

      <TransactionsLayout
        listOnly={searching}
        summary={
          // The limit is this month's: the card says it only there.
          <MonthSummary
            transactions={summaryTransactions}
            budgets={shownMonth === thisMonth ? budgets : null}
            month={shownMonth}
            maxMonth={thisMonth}
            onMonthChange={changeMonth}
            todayDateKey={todayDateKey}
            dayTotals={dayTotals}
            focusDay={focusDay}
            onDayTap={goToDay}
            className={loadingClassName}
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
        {/* Under the card on phones, above the list beside the filter panel from lg up. */}
        <div className="flex flex-col gap-3">
          {/* On phones the field shows only on the search screen, opened by the chip leading the
              row below (2026-10-21: the list starts 56 higher); from lg up it always shows. It
              folds as the header unfolds on Huỷ, so the list does not jump up and back (before the
              script runs, the lg overrides keep it shown on desktop). */}
          <Collapse
            open={searching || wide}
            className="-mb-3 lg:mb-0 lg:h-auto! lg:opacity-100! lg:[clip-path:none]!"
            contentClassName="pb-3 lg:pb-0"
          >
            <TransactionSearchBar
              openRef={searchRef}
              id="transaction-search"
              query={searchFilters.query}
              onQueryChange={changeQuery}
              onFocus={openSearch}
              onCancel={closeSearch}
              cancelable={searching}
              onSubmitQuery={searchHistory.add}
            />
          </Collapse>
          {/* From lg up the filter panel beside the list holds these. */}
          {/* The search screen keeps to the search: no kinds, only what was looked for before (2026-10-24). */}
          <TransactionKindChips
            className={cn("lg:hidden", searching && "hidden")}
            filter={filter}
            onFilterChange={changeKind}
          />
          <TransactionActiveFilters
            className="lg:hidden"
            accounts={accounts}
            categoryGroups={categoryGroups}
            searchFilters={searchFilters}
            onSearchFiltersChange={setSearchFilters}
          />
        </div>
        {/* Keyed to the list's own (deferred) query, so the whole month never flashes between the history and the results. */}
        {searching && !listSearchFilters.query.trim() ? (
          <SearchHistory
            items={searchHistory.items}
            onPick={changeQuery}
            onRemove={searchHistory.remove}
            onClear={searchHistory.clear}
          />
        ) : (
          <div className={loadingClassName}>
            <TransactionsView
              accounts={accounts}
              categoryGroups={categoryGroups}
              todayDateKey={todayDateKey}
              transactions={visibleTransactions}
              dayTotals={allMonths ? undefined : dayTotals}
              isFiltering={isFiltering}
              onClearFilters={clearFilters}
              search={search}
              pastMonthLabel={selectedMonth === thisMonth ? undefined : monthLabelOf(selectedMonth, thisMonth)}
              focusDay={focusDay}
              onAdd={openAdd}
            />
          </div>
        )}
      </TransactionsLayout>

      <FloatingActions concealed={searching} hideOnScroll>
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
        onFilterChange={changeKind}
        onReset={() => {
          setFilter("all")
          resetSheetFilters()
        }}
      />
      {draft && !draft.recorded ? (
        <AddTransactionSheet
          accounts={accounts}
          categoryGroups={categoryGroups}
          draft={draft}
          open={draftOpen}
          onOpenChange={setDraftOpen}
        />
      ) : null}
    </TransactionHistoryProvider>
    </BudgetProvider>
  )
}
