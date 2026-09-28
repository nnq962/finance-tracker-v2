"use client"

import * as React from "react"
import { ListFilterIcon, RotateCcwIcon, SearchIcon, XIcon } from "lucide-react"

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
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
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
import { TransactionPeriodFilter } from "./transaction-period-filter"

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
  rangeLabel: string
  contextLabel: string
  transactionCount: number
  canGoNext: boolean
  onFilterChange: (filter: TransactionFilter) => void
  onSearchFiltersChange: (filters: TransactionSearchFilters) => void
  onPrevious: () => void
  onNext: () => void
  onReset: () => void
}

export function TransactionToolbar({
  accounts,
  categoryGroups,
  filter,
  searchFilters,
  rangeLabel,
  contextLabel,
  transactionCount,
  canGoNext,
  onFilterChange,
  onSearchFiltersChange,
  onPrevious,
  onNext,
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
    <section
      className="space-y-4"
      aria-label="Điều khiển giao dịch"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
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

          <Popover open={isFilterOpen} onOpenChange={handleFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                aria-label={activeFilterCount ? `Bộ lọc, ${activeFilterCount} điều kiện đang áp dụng` : "Bộ lọc"}
              >
                <ListFilterIcon />
                Bộ lọc
                {activeFilterCount > 0 ? (
                  <Badge variant="secondary">{activeFilterCount}</Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={8}
              collisionPadding={16}
              className="max-h-[var(--radix-popover-content-available-height)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto"
            >
              <div className="space-y-5 p-1">
                <div className="flex items-start justify-between gap-4">
                  <PopoverHeader>
                    <PopoverTitle>Bộ lọc giao dịch</PopoverTitle>
                    <PopoverDescription>
                      Lọc giao dịch trong tháng đang xem.
                    </PopoverDescription>
                  </PopoverHeader>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Đóng bộ lọc"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    <XIcon />
                  </Button>
                </div>

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
                        <ToggleGroupItem
                          key={item.value}
                          value={item.value}
                        >
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
                      <FieldLabel htmlFor="transaction-max-amount">
                        Đến
                      </FieldLabel>
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
                        <ToggleGroupItem
                          key={account.id}
                          value={account.id}
                        >
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
                        <ToggleGroupItem
                          key={group.id}
                          value={group.id}
                        >
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
                        <ToggleGroupItem
                          key={group.id}
                          value={group.id}
                        >
                          {group.name}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                </FieldGroup>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <TransactionPeriodFilter
            rangeLabel={rangeLabel}
            canGoNext={canGoNext}
            onPrevious={onPrevious}
            onNext={onNext}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={onReset}
            aria-label="Đặt lại tháng, tìm kiếm và bộ lọc"
            title="Đặt lại tháng, tìm kiếm và bộ lọc"
          >
            <RotateCcwIcon />
          </Button>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {transactionCount} giao dịch
        </span>
        <span aria-hidden="true">·</span>
        <span>{contextLabel}</span>
      </p>

      <Separator />
    </section>
  )
}
