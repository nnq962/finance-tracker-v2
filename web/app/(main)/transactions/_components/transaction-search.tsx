"use client"

import { SearchIcon, XIcon } from "lucide-react"
import * as React from "react"

import { FormSection } from "@/components/app/form-section"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import type { TransactionFilter, TransactionSearchFilters } from "../_types/transaction"
import { countActiveFilters, TransactionFilterFields } from "./transaction-filter-fields"

/** The conditions to count on the filter chip: all but the kind, which the kind chips beside it show. */
export function countSheetFilters(filter: TransactionFilter, searchFilters: TransactionSearchFilters) {
  return countActiveFilters(filter, searchFilters) - Number(filter !== "all")
}

/**
 * The search field. On phones a tap on it opens the search screen (`onFocus`)
 * and `onCancel` (Huỷ) closes it again, clearing the text; from lg up it stays.
 * The list filters as you type, so the keyboard's Search key only puts the
 * keyboard away to show the results, as in native search bars. With a mouse
 * and a hardware keyboard there is nothing to put away: Enter keeps focus in
 * the field so typing and screen readers stay where they were.
 */
export function TransactionSearchBar({
  id,
  query,
  onQueryChange,
  onCancel,
  onFocus,
  autoFocus,
}: {
  id: string
  query: string
  onQueryChange: (query: string) => void
  onCancel?: () => void
  /** The field taking focus, which opens the search screen on phones. */
  onFocus?: () => void
  autoFocus?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <form
      role="search"
      className="flex min-w-0 items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (window.matchMedia("(pointer: coarse)").matches) inputRef.current?.blur()
      }}
    >
      <label htmlFor={id} className="sr-only">
        Tìm giao dịch
      </label>
      <InputGroup variant="search" className="min-w-0 flex-1">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          id={id}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          // Opened by a tap on the search button, it takes the keyboard straight away.
          autoFocus={autoFocus}
          value={query}
          onFocus={onFocus}
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
    </form>
  )
}

/**
 * The filters a phone keeps out of view, in a sheet opened from the filter
 * chip: amount, accounts and categories (the kind chips beside it choose the
 * kind). "Đặt lại" clears these and leaves the kind and the search.
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
              showKind={false}
            />
          </FormSection>
        </div>
        <SheetFooter>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={countSheetFilters(filter, searchFilters) === 0}
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
