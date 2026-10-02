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
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import type {
  TransactionFilter,
  TransactionSearchFilters,
} from "../_types/transaction"
import {
  countActiveFilters,
  TransactionFilterFields,
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

      {isFiltering ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Đang lọc · {transactionCount} giao dịch
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
