"use client"

import { Chip } from "@/components/app/chip"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import type { TransactionFilter, TransactionSearchFilters } from "../_types/transaction"

const kindLabels: Record<Exclude<TransactionFilter, "all">, string> = {
  income: "Chỉ tiền vào",
  expense: "Chỉ tiền ra",
  transfer: "Chỉ chuyển khoản",
  debt: "Chỉ vay nợ",
}

function amountLabel(minAmount: number | null, maxAmount: number | null) {
  if (minAmount !== null && maxAmount !== null) return `${formatCurrency(minAmount)} – ${formatCurrency(maxAmount)}`
  return minAmount !== null ? `Từ ${formatCurrency(minAmount)}` : `Đến ${formatCurrency(maxAmount ?? 0)}`
}

/**
 * The filters in force as a row of chips, each with an × that lifts it, so a
 * list narrowed elsewhere (the filter sheet, an account's sheet) says so and
 * is one tap from whole. Nothing when no filter is on; the search text shows
 * in its own field.
 */
export function TransactionActiveFilters({
  accounts,
  categoryGroups,
  filter,
  searchFilters,
  onFilterChange,
  onSearchFiltersChange,
  className,
}: {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  filter: TransactionFilter
  searchFilters: TransactionSearchFilters
  onFilterChange: (filter: TransactionFilter) => void
  onSearchFiltersChange: (filters: TransactionSearchFilters) => void
  className?: string
}) {
  const { accountIds, categoryGroupIds, minAmount, maxAmount } = searchFilters
  const chips: { key: string; label: string; onRemove: () => void }[] = []

  if (filter !== "all") {
    chips.push({ key: "kind", label: kindLabels[filter], onRemove: () => onFilterChange("all") })
  }
  for (const account of accounts.filter((item) => accountIds.includes(item.id))) {
    chips.push({
      key: `account-${account.id}`,
      label: account.name,
      onRemove: () =>
        onSearchFiltersChange({ ...searchFilters, accountIds: accountIds.filter((id) => id !== account.id) }),
    })
  }
  for (const group of categoryGroups.filter((item) => categoryGroupIds.includes(item.id))) {
    chips.push({
      key: `category-${group.id}`,
      label: group.name,
      onRemove: () =>
        onSearchFiltersChange({ ...searchFilters, categoryGroupIds: categoryGroupIds.filter((id) => id !== group.id) }),
    })
  }
  if (minAmount !== null || maxAmount !== null) {
    chips.push({
      key: "amount",
      label: amountLabel(minAmount, maxAmount),
      onRemove: () => onSearchFiltersChange({ ...searchFilters, minAmount: null, maxAmount: null }),
    })
  }

  if (chips.length === 0) return null

  return (
    // Bleeds to the screen's edges, so chips scroll out of view rather than stop at the margin.
    <div
      className={cn(
        "-mx-(--main-content-px) flex gap-2 overflow-x-auto px-(--main-content-px) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {chips.map((chip) => (
        <Chip key={chip.key} removeLabel="Bỏ lọc" onRemove={chip.onRemove} className="shrink-0">
          {chip.label}
        </Chip>
      ))}
    </div>
  )
}
