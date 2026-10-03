"use client"

import { CurrencyInput } from "@/components/forms/currency-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import type {
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"

const filters: { label: string; value: TransactionFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chi tiền", value: "expense" },
  { label: "Thu tiền", value: "income" },
  { label: "Chuyển khoản", value: "transfer" },
  { label: "Vay nợ", value: "debt" },
]

/** How many conditions narrow the list, not counting the search text. */
export function countActiveFilters(
  filter: TransactionFilter,
  searchFilters: TransactionSearchFilters,
) {
  return (
    Number(filter !== "all") +
    Number(searchFilters.minAmount !== null) +
    Number(searchFilters.maxAmount !== null) +
    searchFilters.accountIds.length +
    searchFilters.categoryGroupIds.length
  )
}

export type TransactionFilterFieldsProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  filter: TransactionFilter
  searchFilters: TransactionSearchFilters
  onFilterChange: (filter: TransactionFilter) => void
  onSearchFiltersChange: (filters: TransactionSearchFilters) => void
}

/**
 * The filter conditions, applied as they change. Shown in a sheet on phones
 * and beside the list on desktop; `idPrefix` keeps the two sets of ids apart.
 */
export function TransactionFilterFields({
  accounts,
  categoryGroups,
  filter,
  searchFilters,
  onFilterChange,
  onSearchFiltersChange,
  idPrefix,
}: TransactionFilterFieldsProps & { idPrefix: string }) {
  const expenseCategoryGroups = categoryGroups.filter(
    (group) => group.type === "expense",
  )
  const incomeCategoryGroups = categoryGroups.filter(
    (group) => group.type === "income",
  )
  // Active accounts first; archived ones still have their old transactions.
  const sortedAccounts = [...accounts].sort(
    (left, right) =>
      Number(left.status === "archived") - Number(right.status === "archived"),
  )
  const { minAmount, maxAmount } = searchFilters
  const amountRangeReversed =
    minAmount !== null && maxAmount !== null && minAmount > maxAmount

  /** Changes the kind, dropping categories that cannot match it (transfers have none). */
  function changeFilter(next: TransactionFilter) {
    onFilterChange(next)
    if (next === "all") return
    const keep = new Set(
      next === "transfer" || next === "debt"
        ? []
        : categoryGroups
            .filter((group) => group.type === next)
            .map((group) => group.id),
    )
    const categoryGroupIds = searchFilters.categoryGroupIds.filter((id) =>
      keep.has(id),
    )
    if (categoryGroupIds.length !== searchFilters.categoryGroupIds.length) {
      onSearchFiltersChange({ ...searchFilters, categoryGroupIds })
    }
  }

  function updateCategoryGroupSelection(
    type: CategoryGroup["type"],
    selectedIds: string[],
  ) {
    const groupIdsForType = new Set(
      categoryGroups
        .filter((group) => group.type === type)
        .map((group) => group.id),
    )
    onSearchFiltersChange({
      ...searchFilters,
      categoryGroupIds: [
        ...searchFilters.categoryGroupIds.filter(
          (selectedId) => !groupIdsForType.has(selectedId),
        ),
        ...selectedIds,
      ],
    })
  }

  return (
    <FieldGroup>
      <Field aria-label="Lọc loại giao dịch">
        <FieldLabel>Loại giao dịch</FieldLabel>
        <ToggleGroup
          type="single"
          size="sm"
          value={filter}
          onValueChange={(value) => {
            if (value) changeFilter(value as TransactionFilter)
          }}
          className="flex-wrap"
          aria-label="Lọc loại giao dịch"
        >
          {filters.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <FieldSet>
        <FieldLegend variant="label">Khoảng số tiền</FieldLegend>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={amountRangeReversed || undefined}>
            <FieldLabel htmlFor={`${idPrefix}-min-amount`}>Từ</FieldLabel>
            <CurrencyInput
              id={`${idPrefix}-min-amount`}
              name="minAmount"
              value={minAmount}
              onValueChange={(value) =>
                onSearchFiltersChange({ ...searchFilters, minAmount: value })
              }
              invalid={amountRangeReversed}
            />
          </Field>
          <Field data-invalid={amountRangeReversed || undefined}>
            <FieldLabel htmlFor={`${idPrefix}-max-amount`}>Đến</FieldLabel>
            <CurrencyInput
              id={`${idPrefix}-max-amount`}
              name="maxAmount"
              value={maxAmount}
              onValueChange={(value) =>
                onSearchFiltersChange({ ...searchFilters, maxAmount: value })
              }
              placeholder="Không giới hạn"
              invalid={amountRangeReversed}
            />
          </Field>
        </div>
        {amountRangeReversed ? (
          <FieldError>Số tiền đến phải lớn hơn số tiền từ.</FieldError>
        ) : null}
      </FieldSet>

      <Field aria-label="Lọc theo tài khoản">
        <FieldLabel>Tài khoản</FieldLabel>
        <ToggleGroup
          type="multiple"
          size="sm"
          value={searchFilters.accountIds}
          onValueChange={(accountIds) =>
            onSearchFiltersChange({ ...searchFilters, accountIds })
          }
          className="flex-wrap"
          aria-label="Lọc theo tài khoản"
        >
          {sortedAccounts.map((account) => (
            <ToggleGroupItem key={account.id} value={account.id}>
              {account.name}
              {account.status === "archived" ? " (đã lưu trữ)" : ""}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      {(filter === "all" || filter === "expense") &&
      expenseCategoryGroups.length > 0 ? (
        <Field aria-label="Lọc theo hạng mục chi">
          <FieldLabel>Hạng mục chi</FieldLabel>
          <ToggleGroup
            type="multiple"
            size="sm"
            value={searchFilters.categoryGroupIds.filter((groupId) =>
              expenseCategoryGroups.some((group) => group.id === groupId),
            )}
            onValueChange={(categoryGroupIds) =>
              updateCategoryGroupSelection("expense", categoryGroupIds)
            }
            className="flex-wrap"
            aria-label="Lọc theo hạng mục chi"
          >
            {expenseCategoryGroups.map((group) => (
              <ToggleGroupItem key={group.id} value={group.id}>
                {group.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      ) : null}

      {(filter === "all" || filter === "income") &&
      incomeCategoryGroups.length > 0 ? (
        <Field aria-label="Lọc theo hạng mục thu">
          <FieldLabel>Hạng mục thu</FieldLabel>
          <ToggleGroup
            type="multiple"
            size="sm"
            value={searchFilters.categoryGroupIds.filter((groupId) =>
              incomeCategoryGroups.some((group) => group.id === groupId),
            )}
            onValueChange={(categoryGroupIds) =>
              updateCategoryGroupSelection("income", categoryGroupIds)
            }
            className="flex-wrap"
            aria-label="Lọc theo hạng mục thu"
          >
            {incomeCategoryGroups.map((group) => (
              <ToggleGroupItem key={group.id} value={group.id}>
                {group.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      ) : null}
    </FieldGroup>
  )
}

/**
 * The filters as a card beside the list, for desktop, where there is room to
 * keep them in view instead of behind the toolbar's sheet.
 */
export function TransactionFilterPanel({
  onReset,
  ...props
}: TransactionFilterFieldsProps & { onReset: () => void }) {
  const activeFilterCount = countActiveFilters(
    props.filter,
    props.searchFilters,
  )

  return (
    <section aria-labelledby="transaction-filters-title" className="space-y-2">
      <div className="flex min-h-6 items-center justify-between gap-3 px-3">
        <h2
          id="transaction-filters-title"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Bộ lọc
        </h2>
        {activeFilterCount > 0 ? (
          <Button type="button" variant="ghost" size="xs" onClick={onReset}>
            Đặt lại
          </Button>
        ) : null}
      </div>
      <Card>
        <CardContent>
          <TransactionFilterFields idPrefix="transaction-panel" {...props} />
        </CardContent>
      </Card>
    </section>
  )
}
