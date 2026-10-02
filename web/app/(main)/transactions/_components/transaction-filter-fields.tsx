"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import type {
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"

const filters: { label: string; value: Exclude<TransactionFilter, "all"> }[] = [
  { label: "Chi tiền", value: "expense" },
  { label: "Thu tiền", value: "income" },
  { label: "Chuyển khoản", value: "transfer" },
]

function parseAmount(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return null

  const amount = Number(digits)
  return Number.isSafeInteger(amount) ? amount : null
}

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
          value={filter === "all" ? "" : filter}
          onValueChange={(value) =>
            onFilterChange(value ? (value as TransactionFilter) : "all")
          }
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

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-min-amount`}>Số tiền từ</FieldLabel>
          <Input
            id={`${idPrefix}-min-amount`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={searchFilters.minAmount?.toString() ?? ""}
            onChange={(event) =>
              onSearchFiltersChange({
                ...searchFilters,
                minAmount: parseAmount(event.target.value),
              })
            }
            placeholder="0"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-max-amount`}>Đến</FieldLabel>
          <Input
            id={`${idPrefix}-max-amount`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={searchFilters.maxAmount?.toString() ?? ""}
            onChange={(event) =>
              onSearchFiltersChange({
                ...searchFilters,
                maxAmount: parseAmount(event.target.value),
              })
            }
            placeholder="Không giới hạn"
          />
        </Field>
      </div>

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
          {accounts.map((account) => (
            <ToggleGroupItem key={account.id} value={account.id}>
              {account.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

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
  const activeFilterCount = countActiveFilters(props.filter, props.searchFilters)

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
