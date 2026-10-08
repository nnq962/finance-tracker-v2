"use client"

import { Chip } from "@/components/app/chip"
import { ChipRow } from "@/components/app/chip-row"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"

import type { TransactionSearchFilters } from "../_types/transaction"

function amountLabel(minAmount: number | null, maxAmount: number | null) {
  if (minAmount !== null && maxAmount !== null) return `${formatCurrency(minAmount)} – ${formatCurrency(maxAmount)}`
  return minAmount !== null ? `Từ ${formatCurrency(minAmount)}` : `Đến ${formatCurrency(maxAmount ?? 0)}`
}

/**
 * The filters from the filter sheet that are in force (accounts, categories,
 * amount), each with what lifts it. The kind is not among them: the kind
 * chips above the list show it.
 */
export function getSheetFilterChips(
  accounts: Account[],
  categoryGroups: CategoryGroup[],
  searchFilters: TransactionSearchFilters,
) {
  const { accountIds, categoryGroupIds, minAmount, maxAmount } = searchFilters
  const chips: { key: string; label: string; remove: () => TransactionSearchFilters }[] = []

  for (const account of accounts.filter((item) => accountIds.includes(item.id))) {
    chips.push({
      key: `account-${account.id}`,
      label: account.name,
      remove: () => ({ ...searchFilters, accountIds: accountIds.filter((id) => id !== account.id) }),
    })
  }
  for (const group of categoryGroups.filter((item) => categoryGroupIds.includes(item.id))) {
    chips.push({
      key: `category-${group.id}`,
      label: group.name,
      remove: () => ({ ...searchFilters, categoryGroupIds: categoryGroupIds.filter((id) => id !== group.id) }),
    })
  }
  if (minAmount !== null || maxAmount !== null) {
    chips.push({
      key: "amount",
      label: amountLabel(minAmount, maxAmount),
      remove: () => ({ ...searchFilters, minAmount: null, maxAmount: null }),
    })
  }
  return chips
}

/**
 * The sheet's filters in force as a row of chips, each with an × that lifts
 * it, so a list narrowed elsewhere (the filter sheet, an account's sheet)
 * says so and is one tap from whole. Nothing when none is on; the search text
 * shows in its own field and the kind in the kind chips.
 */
export function TransactionActiveFilters({
  accounts,
  categoryGroups,
  searchFilters,
  onSearchFiltersChange,
  className,
}: {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  searchFilters: TransactionSearchFilters
  onSearchFiltersChange: (filters: TransactionSearchFilters) => void
  className?: string
}) {
  const chips = getSheetFilterChips(accounts, categoryGroups, searchFilters)
  if (chips.length === 0) return null

  return (
    <ChipRow className={className}>
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          removeLabel="Bỏ lọc"
          onRemove={() => onSearchFiltersChange(chip.remove())}
          className="shrink-0"
        >
          {chip.label}
        </Chip>
      ))}
    </ChipRow>
  )
}
