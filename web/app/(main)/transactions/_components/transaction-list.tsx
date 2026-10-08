import { ReceiptTextIcon, SearchXIcon } from "lucide-react"

import { SettingsGroup } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
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
import type { Transaction } from "../_types/transaction"
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
  /** A search or filter narrows the list, so an empty one means nothing matched. */
  isFiltering: boolean
  onClearFilters: () => void
  /** While searching on a phone: the results as one list, the match marked, each row dated. */
  search?: TransactionSearchResults
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
    <Button type="button" variant="outline" onClick={search.onSearchAllMonths}>
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
              <Button type="button" variant="outline" onClick={search.onClearFilters}>
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
      <div className="flex min-h-6 items-center justify-between gap-3 px-4 text-xs">
        <p aria-live="polite" className="min-w-0 text-muted-foreground">
          {transactions.length} kết quả trong {search.scopeLabel}
          {netBalance !== 0
            ? ` · tổng ${netBalance > 0 ? "+" : "−"}${formatCurrency(netBalance, { signDisplay: "never" })}`
            : null}
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
      <SettingsGroup>
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
  isFiltering,
  onClearFilters,
  search,
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

  if (groups.length === 0) {
    return isFiltering ? (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>Không có giao dịch phù hợp</EmptyTitle>
          <EmptyDescription>Thử từ khoá khác hoặc bỏ bớt điều kiện lọc.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Xoá bộ lọc
          </Button>
        </EmptyContent>
      </Empty>
    ) : (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptTextIcon />
          </EmptyMedia>
          <EmptyTitle>Chưa có giao dịch trong tháng này</EmptyTitle>
          <EmptyDescription>Ghi khoản thu chi đầu tiên để theo dõi tiền của bạn.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {groups.map((group) => (
        <TransactionDateGroup
          accounts={accounts}
          categoryGroups={categoryGroups}
          key={group.dateKey}
          group={group}
          todayDateKey={todayDateKey}
        />
      ))}
    </div>
  )
}
