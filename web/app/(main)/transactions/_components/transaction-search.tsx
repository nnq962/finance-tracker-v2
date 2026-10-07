"use client"

import { SearchIcon, XIcon } from "lucide-react"

import { FormSection } from "@/components/app/form-section"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import type { TransactionFilter, TransactionSearchFilters } from "../_types/transaction"
import { countActiveFilters, TransactionFilterFields } from "./transaction-filter-fields"

/** The conditions to count on the filter button: all but spending or income, which the switch above the list shows. */
export function countSheetFilters(filter: TransactionFilter, searchFilters: TransactionSearchFilters) {
  return countActiveFilters(filter, searchFilters) - Number(filter === "expense" || filter === "income")
}

/**
 * The search field. On phones it opens from the header's search button and
 * `onCancel` closes it again, clearing the text; from lg up it stays.
 */
export function TransactionSearchBar({
  id,
  query,
  onQueryChange,
  onCancel,
  autoFocus,
}: {
  id: string
  query: string
  onQueryChange: (query: string) => void
  onCancel?: () => void
  autoFocus?: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor={id} className="sr-only">
        Tìm giao dịch
      </label>
      <InputGroup className="min-w-0 flex-1">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          type="text"
          inputMode="search"
          // Opened by a tap on the search button, it takes the keyboard straight away.
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Tìm giao dịch"
        />
        {query ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Xoá tìm kiếm" onClick={() => onQueryChange("")}>
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {onCancel ? (
        <Button type="button" variant="ghost" className="shrink-0 px-3" onClick={onCancel}>
          Huỷ
        </Button>
      ) : null}
    </div>
  )
}

/**
 * The filters a phone keeps out of view, in a sheet opened from the header:
 * the kind, amount, accounts and categories. "Đặt lại" leaves the search.
 */
export function TransactionFilterSheet({
  open,
  onOpenChange,
  accounts,
  categoryGroups,
  filter,
  searchFilters,
  transactionCount,
  onFilterChange,
  onSearchFiltersChange,
  onReset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  filter: TransactionFilter
  searchFilters: TransactionSearchFilters
  /** How many transactions the search and filters leave. */
  transactionCount: number
  onFilterChange: (filter: TransactionFilter) => void
  onSearchFiltersChange: (filters: TransactionSearchFilters) => void
  onReset: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        aria-describedby={undefined}
        variant="screen"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetNavHeader title="Bộ lọc" />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
          <FormSection>
            <TransactionFilterFields
              idPrefix="transaction-sheet"
              accounts={accounts}
              categoryGroups={categoryGroups}
              filter={filter}
              searchFilters={searchFilters}
              onFilterChange={onFilterChange}
              onSearchFiltersChange={onSearchFiltersChange}
            />
          </FormSection>
        </div>
        <SheetFooter>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={countActiveFilters(filter, searchFilters) === 0}
              onClick={onReset}
            >
              Đặt lại
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Xem {transactionCount} giao dịch
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
