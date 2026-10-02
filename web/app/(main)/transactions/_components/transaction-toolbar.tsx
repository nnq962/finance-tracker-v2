"use client"

import * as React from "react"
import { ListFilterIcon, SearchIcon, XIcon } from "lucide-react"

import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
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

type SearchFilterDraft = {
  minAmount: string
  maxAmount: string
  accountIds: string[]
  categoryGroupIds: string[]
}

function createSearchFilterDraft(
  filters: TransactionSearchFilters,
): SearchFilterDraft {
  return {
    minAmount: filters.minAmount?.toString() ?? "",
    maxAmount: filters.maxAmount?.toString() ?? "",
    accountIds: [...filters.accountIds],
    categoryGroupIds: [...filters.categoryGroupIds],
  }
}

function parseAmount(value: string) {
  if (!value.trim()) return null

  const amount = Number(value)
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null
}

function createSearchFilters(
  draft: SearchFilterDraft,
  current: TransactionSearchFilters,
): TransactionSearchFilters {
  return {
    query: current.query,
    minAmount: parseAmount(draft.minAmount),
    maxAmount: parseAmount(draft.maxAmount),
    accountIds: [...draft.accountIds],
    categoryGroupIds: [...draft.categoryGroupIds],
  }
}

type TransactionToolbarProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  filter: TransactionFilter
  searchFilters: TransactionSearchFilters
  transactionCount: number
  onFilterChange: (filter: TransactionFilter) => void
  onSearchFiltersChange: (filters: TransactionSearchFilters) => void
  onReset: () => void
}

export function TransactionToolbar({
  accounts,
  categoryGroups,
  filter,
  searchFilters,
  transactionCount,
  onFilterChange,
  onSearchFiltersChange,
  onReset,
}: TransactionToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(() =>
    createSearchFilterDraft(searchFilters),
  )
  const expenseCategoryGroups = categoryGroups.filter(
    (group) => group.type === "expense",
  )
  const incomeCategoryGroups = categoryGroups.filter(
    (group) => group.type === "income",
  )

  const activeFilterCount =
    Number(filter !== "all") +
    Number(searchFilters.minAmount !== null) +
    Number(searchFilters.maxAmount !== null) +
    searchFilters.accountIds.length +
    searchFilters.categoryGroupIds.length
  const isFiltering = activeFilterCount > 0 || searchFilters.query.trim() !== ""

  function handleFilterOpenChange(open: boolean) {
    if (open) setDraft(createSearchFilterDraft(searchFilters))
    setIsFilterOpen(open)
  }

  function updateSearchFilterDraft(nextDraft: SearchFilterDraft) {
    setDraft(nextDraft)
    onSearchFiltersChange(createSearchFilters(nextDraft, searchFilters))
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
    updateSearchFilterDraft({
      ...draft,
      categoryGroupIds: [
        ...draft.categoryGroupIds.filter(
          (selectedId) => !groupIdsForType.has(selectedId),
        ),
        ...selectedIds,
      ],
    })
  }

  return (
    <section className="space-y-3" aria-label="Tìm và lọc giao dịch">
      <div className="flex min-w-0 items-center gap-2">
        <label htmlFor="transaction-quick-search" className="sr-only">
          Tìm giao dịch
        </label>
        <InputGroup className="min-w-0 max-w-md flex-1">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="transaction-quick-search"
            type="text"
            inputMode="search"
            value={searchFilters.query}
            onChange={(event) =>
              onSearchFiltersChange({
                ...searchFilters,
                query: event.target.value,
              })
            }
            placeholder="Tìm giao dịch..."
          />
          {searchFilters.query ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Xóa tìm kiếm"
                onClick={() =>
                  onSearchFiltersChange({ ...searchFilters, query: "" })
                }
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          aria-label={activeFilterCount ? `Lọc, ${activeFilterCount} điều kiện đang áp dụng` : "Lọc"}
          onClick={() => handleFilterOpenChange(true)}
        >
          <ListFilterIcon />
          Lọc
          {activeFilterCount > 0 ? (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          ) : null}
        </Button>
      </div>

      {isFiltering ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Đang lọc · {transactionCount} giao dịch
        </p>
      ) : null}

      <Sheet open={isFilterOpen} onOpenChange={handleFilterOpenChange}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader title="Bộ lọc" />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
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
                  <FieldLabel htmlFor="transaction-min-amount">
                    Số tiền từ
                  </FieldLabel>
                  <Input
                    id="transaction-min-amount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={draft.minAmount}
                    onChange={(event) =>
                      updateSearchFilterDraft({
                        ...draft,
                        minAmount: event.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="0"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="transaction-max-amount">Đến</FieldLabel>
                  <Input
                    id="transaction-max-amount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={draft.maxAmount}
                    onChange={(event) =>
                      updateSearchFilterDraft({
                        ...draft,
                        maxAmount: event.target.value.replace(/\D/g, ""),
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
                  value={draft.accountIds}
                  onValueChange={(accountIds) =>
                    updateSearchFilterDraft({ ...draft, accountIds })
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
                  value={draft.categoryGroupIds.filter((groupId) =>
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
                  value={draft.categoryGroupIds.filter((groupId) =>
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
          </div>
          <SheetFooter>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={activeFilterCount === 0}
                onClick={() => {
                  onReset()
                  setDraft(createSearchFilterDraft({ ...searchFilters, minAmount: null, maxAmount: null, accountIds: [], categoryGroupIds: [] }))
                }}
              >
                Đặt lại
              </Button>
              <Button type="button" onClick={() => setIsFilterOpen(false)}>
                Xem {transactionCount} giao dịch
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  )
}
