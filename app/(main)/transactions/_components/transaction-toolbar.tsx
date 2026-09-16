"use client"

import * as React from "react"
import { RotateCcwIcon, SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
  TransactionPeriod,
  TransactionSearchFilters,
} from "../_types/transaction"
import { TransactionPeriodFilter } from "./transaction-period-filter"

const filters: { label: string; value: TransactionFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chi tiền", value: "expense" },
  { label: "Thu tiền", value: "income" },
  { label: "Chuyển khoản", value: "transfer" },
  { label: "Vay nợ", value: "loan" },
]

type SearchFilterDraft = {
  query: string
  minAmount: string
  maxAmount: string
  accountIds: string[]
  categoryGroupIds: string[]
}

function createSearchFilterDraft(
  filters: TransactionSearchFilters,
): SearchFilterDraft {
  return {
    query: filters.query,
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
): TransactionSearchFilters {
  return {
    query: draft.query.trim(),
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
  period: TransactionPeriod
  rangeLabel: string
  contextLabel: string
  transactionCount: number
  canGoNext: boolean
  onFilterChange: (filter: TransactionFilter) => void
  onSearchFiltersChange: (filters: TransactionSearchFilters) => void
  onPeriodChange: (period: TransactionPeriod) => void
  onPrevious: () => void
  onNext: () => void
  onReset: () => void
}

export function TransactionToolbar({
  accounts,
  categoryGroups,
  filter,
  searchFilters,
  period,
  rangeLabel,
  contextLabel,
  transactionCount,
  canGoNext,
  onFilterChange,
  onSearchFiltersChange,
  onPeriodChange,
  onPrevious,
  onNext,
  onReset,
}: TransactionToolbarProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(() =>
    createSearchFilterDraft(searchFilters),
  )
  const expenseCategoryGroups = categoryGroups.filter(
    (group) => group.type === "expense",
  )
  const incomeCategoryGroups = categoryGroups.filter(
    (group) => group.type === "income",
  )

  function handleSearchOpenChange(open: boolean) {
    if (open) setDraft(createSearchFilterDraft(searchFilters))
    setIsSearchOpen(open)
  }

  function updateSearchFilterDraft(nextDraft: SearchFilterDraft) {
    setDraft(nextDraft)
    onSearchFiltersChange(createSearchFilters(nextDraft))
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
          (groupId) => !groupIdsForType.has(groupId),
        ),
        ...selectedIds,
      ],
    })
  }

  return (
    <section
      className="space-y-2 xl:space-y-4"
      aria-label="Điều khiển giao dịch"
    >
      <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between xl:gap-4">
        <div className="min-w-0 space-y-2">
          <div className="overflow-x-auto pb-1">
            <ToggleGroup
              type="single"
              variant="outline"
              size="lg"
              value={filter}
              onValueChange={(value) => {
                if (value) onFilterChange(value as TransactionFilter)
              }}
              aria-label="Lọc loại giao dịch"
            >
              {filters.map((item) => (
                <ToggleGroupItem
                  key={item.value}
                  value={item.value}
                  aria-label={item.label}
                  className="bg-white hover:bg-white data-[state=on]:bg-muted data-[state=on]:hover:bg-muted dark:bg-transparent dark:hover:bg-muted dark:data-[state=on]:bg-muted"
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <p className="hidden items-center gap-1.5 text-sm text-muted-foreground xl:flex">
            <span className="font-medium text-foreground">
              {transactionCount} giao dịch
            </span>
            <span aria-hidden="true">·</span>
            <span>{contextLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:justify-end xl:overflow-visible xl:pb-0">
          <TransactionPeriodFilter
            period={period}
            rangeLabel={rangeLabel}
            canGoNext={canGoNext}
            onPeriodChange={onPeriodChange}
            onPrevious={onPrevious}
            onNext={onNext}
          />

          <Popover open={isSearchOpen} onOpenChange={handleSearchOpenChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="shrink-0"
                aria-label="Tìm kiếm và lọc giao dịch"
                title="Tìm kiếm và lọc giao dịch"
              >
                <SearchIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              collisionPadding={16}
              className="max-h-[var(--radix-popover-content-available-height)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto"
            >
              <div className="space-y-5 p-1">
                <div className="flex items-start justify-between gap-4">
                  <PopoverHeader>
                    <PopoverTitle>Tìm kiếm & lọc</PopoverTitle>
                    <PopoverDescription>
                      Lọc giao dịch trong kỳ đang chọn.
                    </PopoverDescription>
                  </PopoverHeader>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Đóng tìm kiếm và lọc"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <XIcon />
                  </Button>
                </div>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="transaction-search-query">
                      Từ khóa
                    </FieldLabel>
                    <Input
                      id="transaction-search-query"
                      value={draft.query}
                      onChange={(event) =>
                        updateSearchFilterDraft({
                          ...draft,
                          query: event.target.value,
                        })
                      }
                      placeholder="Ăn trưa, Netflix..."
                    />
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

                  <Field>
                    <FieldLabel>Tài khoản</FieldLabel>
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
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
                          aria-label={account.name}
                        >
                          {account.name}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>

                  <Field>
                    <FieldLabel>Hạng mục chi</FieldLabel>
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
                      size="sm"
                      value={draft.categoryGroupIds.filter((groupId) =>
                        expenseCategoryGroups.some(
                          (group) => group.id === groupId,
                        ),
                      )}
                      onValueChange={(categoryGroupIds) =>
                        updateCategoryGroupSelection(
                          "expense",
                          categoryGroupIds,
                        )
                      }
                      className="flex-wrap"
                      aria-label="Lọc theo hạng mục chi"
                    >
                      {expenseCategoryGroups.map((group) => (
                        <ToggleGroupItem
                          key={group.id}
                          value={group.id}
                          aria-label={group.name}
                        >
                          {group.name}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>

                  <Field>
                    <FieldLabel>Hạng mục thu</FieldLabel>
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
                      size="sm"
                      value={draft.categoryGroupIds.filter((groupId) =>
                        incomeCategoryGroups.some(
                          (group) => group.id === groupId,
                        ),
                      )}
                      onValueChange={(categoryGroupIds) =>
                        updateCategoryGroupSelection(
                          "income",
                          categoryGroupIds,
                        )
                      }
                      className="flex-wrap"
                      aria-label="Lọc theo hạng mục thu"
                    >
                      {incomeCategoryGroups.map((group) => (
                        <ToggleGroupItem
                          key={group.id}
                          value={group.id}
                          aria-label={group.name}
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

          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="shrink-0"
            onClick={onReset}
            aria-label="Đặt lại kỳ và bộ lọc"
            title="Đặt lại kỳ và bộ lọc"
          >
            <RotateCcwIcon />
          </Button>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground xl:hidden">
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
