import { PlusIcon, ReceiptTextIcon, SearchXIcon } from "lucide-react"

import { SettingsGroup } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, formatShortDate, toDateKey } from "@/lib/format-date"

import { getTransactionSummary } from "../_lib/get-transaction-summary"
import { groupTransactionsByDate } from "../_lib/group-transactions-by-date"
import type { Transaction, TransactionSummaryData } from "../_types/transaction"
import { TransactionDateGroup } from "./transaction-date-group"
import { TransactionItem } from "./transaction-item"

export type TransactionSearchResults = {
  query: string
  /** Where it looked: "Tháng 10", "mọi tháng". */
  scopeLabel: string
  /** Looks through every month; absent once it does. */
  onSearchAllMonths?: () => void
  /** Every month is still loading. */
  loading?: boolean
  /** The filters narrowing the results, to say so when nothing is found. */
  filterLabels: string[]
  /** Lifts those filters, keeping the search. */
  onClearFilters: () => void
}

type TransactionListProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  todayDateKey: string
  transactions: Transaction[]
  /** Each day's figures under every filter but the kind, for the day headers. */
  dayTotals?: Record<string, TransactionSummaryData>
  /** A search or filter narrows the list, so an empty one means nothing matched. */
  isFiltering: boolean
  onClearFilters: () => void
  /** While searching on a phone: the results as one list, the match marked, each row dated. */
  search?: TransactionSearchResults
  /** A past month shown ("Tháng 9", "Tháng 1/2025"), which an empty list names; unset for this month. */
  pastMonthLabel?: string
  /** The day a bar of the month's chart was tapped for. */
  focusDay?: string | null
  /** Opens a new transaction, from an empty month. */
  onAdd?: () => void
}

/** The day of a result, with its year when that is not this one. */
function resultDateLabel(occurredAt: string, todayDateKey: string) {
  const dateKey = toDateKey(occurredAt)
  return dateKey.slice(0, 4) === todayDateKey.slice(0, 4) ? formatShortDate(dateKey) : formatDate(dateKey)
}

/**
 * Search results, as native search screens list them: how many and what they
 * add up to, then one list newest first, the searched text marked in each
 * title and the day in place of the time. Nothing found says what was looked
 * for, where and through which filters, with the ways to widen it.
 */
function SearchResults({
  accounts,
  categoryGroups,
  todayDateKey,
  transactions,
  search,
}: Omit<TransactionListProps, "search" | "isFiltering" | "onClearFilters"> & { search: TransactionSearchResults }) {
  const searchAllMonths = search.onSearchAllMonths ? (
    <Button type="button" variant="secondary" onClick={search.onSearchAllMonths}>
      Tìm mọi tháng
    </Button>
  ) : null

  if (search.loading) {
    return <p className="px-4 text-xs text-muted-foreground">Đang tìm trong mọi tháng…</p>
  }

  if (transactions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>
            Không có “{search.query.trim()}” trong {search.scopeLabel}
          </EmptyTitle>
          <EmptyDescription>
            {search.filterLabels.length > 0
              ? `Đang lọc: ${search.filterLabels.join(", ")}`
              : "Thử từ khoá khác."}
          </EmptyDescription>
        </EmptyHeader>
        {search.filterLabels.length > 0 || searchAllMonths ? (
          <EmptyContent className="flex-row justify-center gap-2">
            {search.filterLabels.length > 0 ? (
              <Button type="button" variant="secondary" onClick={search.onClearFilters}>
                Bỏ lọc
              </Button>
            ) : null}
            {searchAllMonths}
          </EmptyContent>
        ) : null}
      </Empty>
    )
  }

  const { netBalance } = getTransactionSummary(transactions)

  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center justify-between gap-3 text-xs">
        <p aria-live="polite" className="min-w-0 text-muted-foreground">
          {transactions.length} kết quả trong {search.scopeLabel}
          {/* The sum kept whole: a line too long breaks before "tổng", not inside it. */}
          {netBalance !== 0 ? (
            <>
              {" · "}
              <span className="whitespace-nowrap">
                tổng {netBalance > 0 ? "+" : "−"}
                {formatCurrency(netBalance, { signDisplay: "never" })}
              </span>
            </>
          ) : null}
        </p>
        {search.onSearchAllMonths ? (
          <button
            type="button"
            onClick={search.onSearchAllMonths}
            className="relative shrink-0 font-semibold text-foreground after:absolute after:-inset-x-2 after:-inset-y-3"
          >
            Tìm mọi tháng
          </button>
        ) : null}
      </div>
      {/* Flat, as the days' list (2026-10-21). */}
      <SettingsGroup flat>
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            accounts={accounts}
            categoryGroups={categoryGroups}
            transaction={transaction}
            dateLabel={resultDateLabel(transaction.occurredAt, todayDateKey)}
            highlight={search.query}
          />
        ))}
      </SettingsGroup>
    </div>
  )
}

export function TransactionList({
  accounts,
  categoryGroups,
  todayDateKey,
  transactions,
  dayTotals,
  isFiltering,
  onClearFilters,
  search,
  pastMonthLabel,
  focusDay,
  onAdd,
}: TransactionListProps) {
  if (search) {
    return (
      <SearchResults
        accounts={accounts}
        categoryGroups={categoryGroups}
        todayDateKey={todayDateKey}
        transactions={transactions}
        search={search}
      />
    )
  }

  const groups = groupTransactionsByDate(transactions)

  // Empty, in a card as the days are (2026-10-24): what to do next as a button.
  if (groups.length === 0) {
    return isFiltering ? (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Không có giao dịch phù hợp</EmptyTitle>
            <EmptyDescription>Thử từ khoá khác hoặc bỏ bớt điều kiện lọc.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={onClearFilters}>
              Xoá bộ lọc
            </Button>
          </EmptyContent>
        </Empty>
      </Card>
    ) : (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            {/* A past month asks for what was forgotten, not for a first entry. */}
            {pastMonthLabel ? (
              <>
                <EmptyTitle>Không có giao dịch trong {pastMonthLabel}</EmptyTitle>
                <EmptyDescription>Khoản nào quên ghi, thêm giao dịch và chọn ngày trong tháng đó.</EmptyDescription>
              </>
            ) : (
              <>
                <EmptyTitle>Chưa có giao dịch trong tháng này</EmptyTitle>
                <EmptyDescription>Ghi khoản thu chi đầu tiên để theo dõi tiền của bạn.</EmptyDescription>
              </>
            )}
          </EmptyHeader>
          {onAdd ? (
            <EmptyContent>
              <Button type="button" onClick={onAdd}>
                <PlusIcon data-icon="inline-start" />
                Thêm giao dịch
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      </Card>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {groups.map((group) => (
        <TransactionDateGroup
          accounts={accounts}
          categoryGroups={categoryGroups}
          key={group.dateKey}
          group={group}
          totals={dayTotals?.[group.dateKey]}
          todayDateKey={todayDateKey}
          focused={group.dateKey === focusDay}
        />
      ))}
    </div>
  )
}
