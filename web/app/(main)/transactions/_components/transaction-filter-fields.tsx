"use client"

import * as React from "react"

import { Collapse } from "@/components/app/collapse"
import { AccountLogo } from "@/components/account-logo"
import { CurrencyInput } from "@/components/forms/currency-input"
import { groupCaptionClassName } from "@/components/settings-list"
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
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import { amountPreset, amountPresets } from "../_lib/amount-presets"
import type {
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"

/** The kinds a list can be narrowed to, as chips. */
export const transactionKindOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Tiền vào", value: "income" },
  { label: "Tiền ra", value: "expense" },
  { label: "Chuyển khoản", value: "transfer" },
  { label: "Vay nợ", value: "debt" },
] as const satisfies readonly { label: string; value: TransactionFilter }[]

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

/**
 * The search filters once the kind changes to `kind`: chosen categories that
 * cannot match it go (transfers and loans have none). The same object when
 * nothing goes.
 */
export function filtersForKind(
  kind: TransactionFilter,
  searchFilters: TransactionSearchFilters,
  categoryGroups: CategoryGroup[],
) {
  if (kind === "all") return searchFilters
  const keep = new Set(
    kind === "transfer" || kind === "debt"
      ? []
      : categoryGroups.filter((group) => group.type === kind).map((group) => group.id),
  )
  const categoryGroupIds = searchFilters.categoryGroupIds.filter((id) => keep.has(id))
  return categoryGroupIds.length === searchFilters.categoryGroupIds.length
    ? searchFilters
    : { ...searchFilters, categoryGroupIds }
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
 * The filter conditions on one screen, applied as they change, beside the
 * list on desktop (phones pick them in TransactionFilterSheet): the kind, the
 * amount from a few ranges or typed, and the accounts and categories as chips
 * with their logos and icons.
 */
export function TransactionFilterFields({
  accounts,
  categoryGroups,
  filter,
  searchFilters,
  onFilterChange,
  onSearchFiltersChange,
  idPrefix,
}: TransactionFilterFieldsProps & {
  idPrefix: string
}) {
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
  const preset = amountPreset(searchFilters)
  // Typing a range: open from a tap on Tuỳ chỉnh, and whenever the range is not a preset.
  const [customOpen, setCustomOpen] = React.useState(false)
  const custom = customOpen || !preset

  /** Changes the kind, dropping categories that cannot match it. */
  function changeFilter(next: TransactionFilter) {
    onFilterChange(next)
    const narrowed = filtersForKind(next, searchFilters, categoryGroups)
    if (narrowed !== searchFilters) onSearchFiltersChange(narrowed)
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
          {transactionKindOptions.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <FieldSet>
        <FieldLegend variant="label">Số tiền</FieldLegend>
        <ToggleGroup
          type="single"
          size="sm"
          value={custom ? "custom" : preset?.key}
          onValueChange={(value) => {
            if (!value) return
            if (value === "custom") return setCustomOpen(true)
            const next = amountPresets.find((option) => option.key === value)
            if (!next) return
            setCustomOpen(false)
            onSearchFiltersChange({ ...searchFilters, minAmount: next.min, maxAmount: next.max })
          }}
          className="flex-wrap"
          aria-label="Lọc theo số tiền"
        >
          {amountPresets.map((option) => (
            <ToggleGroupItem key={option.key} value={option.key}>
              {option.label}
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem value="custom">Tuỳ chỉnh</ToggleGroupItem>
        </ToggleGroup>
        {/* Under the chips, 12px off them open; folded, it takes back the fieldset's gap too. */}
        <Collapse open={custom} className="-mt-3 data-[state=closed]:-mt-6">
          <div className="flex flex-col gap-2">
            {/* One above the other, so each field and its suggestions have the full width. */}
            <div className="flex flex-col gap-3">
              <Field data-invalid={amountRangeReversed || undefined}>
                <FieldLabel htmlFor={`${idPrefix}-min-amount`} className="sr-only">
                  Từ
                </FieldLabel>
                <CurrencyInput
                  id={`${idPrefix}-min-amount`}
                  name="minAmount"
                  value={minAmount}
                  onValueChange={(value) =>
                    onSearchFiltersChange({ ...searchFilters, minAmount: value })
                  }
                  placeholder="Từ"
                  invalid={amountRangeReversed}
                />
              </Field>
              <Field data-invalid={amountRangeReversed || undefined}>
                <FieldLabel htmlFor={`${idPrefix}-max-amount`} className="sr-only">
                  Đến
                </FieldLabel>
                <CurrencyInput
                  id={`${idPrefix}-max-amount`}
                  name="maxAmount"
                  value={maxAmount}
                  onValueChange={(value) =>
                    onSearchFiltersChange({ ...searchFilters, maxAmount: value })
                  }
                  placeholder="Đến"
                  invalid={amountRangeReversed}
                />
              </Field>
            </div>
            {amountRangeReversed ? (
              <FieldError>Số tiền đến phải lớn hơn số tiền từ.</FieldError>
            ) : null}
          </div>
        </Collapse>
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
              <AccountLogo account={account} size="xs" />
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
                <CategoryGlyph group={group} />
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
                <CategoryGlyph group={group} />
                {group.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      ) : null}
    </FieldGroup>
  )
}

/** A category group's icon in its colour, at the start of its chip. */
function CategoryGlyph({ group }: { group: CategoryGroup }) {
  const Icon = categoryIconRegistry[group.iconName]
  return <Icon aria-hidden="true" className={getCategoryColor(group.colorName).iconClassName} />
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
        <h2 id="transaction-filters-title" className={groupCaptionClassName}>
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
