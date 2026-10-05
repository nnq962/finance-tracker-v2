"use client"

import * as React from "react"
import { ListFilterIcon, SearchIcon, XIcon } from "lucide-react"

import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import type {
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"
import {
  countActiveFilters,
  TransactionFilterFields,
  transactionKindFilters,
  withKindFilter,
} from "./transaction-filter-fields"

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
  const activeFilterCount = countActiveFilters(filter, searchFilters)
  const isFiltering = activeFilterCount > 0 || searchFilters.query.trim() !== ""

  return (
    <section className="space-y-3" aria-label="Tìm và lọc giao dịch">
      <div className="flex min-w-0 items-center gap-2">
        <label htmlFor="transaction-quick-search" className="sr-only">
          Tìm giao dịch
        </label>
        <InputGroup className="min-w-0 max-w-md flex-1 lg:max-w-none">
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
          // From lg up the filters sit beside the list instead.
          className="shrink-0 lg:hidden"
          aria-label={activeFilterCount ? `Lọc, ${activeFilterCount} điều kiện đang áp dụng` : "Lọc"}
          onClick={() => setIsFilterOpen(true)}
        >
          <ListFilterIcon />
          Lọc
          {activeFilterCount > 0 ? (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          ) : null}
        </Button>
      </div>

      {/* The kind as chips that scroll sideways, edge to edge, as in a phone
          app; from lg up it is in the filter panel beside the list. */}
      <div className="mx-[calc(var(--main-content-px)*-1)] overflow-x-auto px-(--main-content-px) [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filter}
          onValueChange={(value) => {
            if (!value) return
            const next = value as TransactionFilter
            onFilterChange(next)
            const nextSearchFilters = withKindFilter(next, searchFilters, categoryGroups)
            if (nextSearchFilters !== searchFilters) onSearchFiltersChange(nextSearchFilters)
          }}
          aria-label="Lọc loại giao dịch"
        >
          {transactionKindFilters.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isFiltering ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {transactionCount} kết quả
        </p>
      ) : null}

      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader title="Bộ lọc" />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
            <TransactionFilterFields
              idPrefix="transaction-sheet"
              accounts={accounts}
              categoryGroups={categoryGroups}
              filter={filter}
              searchFilters={searchFilters}
              onFilterChange={onFilterChange}
              onSearchFiltersChange={onSearchFiltersChange}
            />
          </div>
          <SheetFooter>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={activeFilterCount === 0}
                onClick={onReset}
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
