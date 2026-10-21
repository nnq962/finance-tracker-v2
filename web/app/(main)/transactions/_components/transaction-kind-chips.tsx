"use client"

import * as React from "react"
import { ListFilterIcon, SearchIcon } from "lucide-react"

import { ChipButton, ChipRow, ChipRowDivider } from "@/components/app/chip-row"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import type { TransactionFilter } from "../_types/transaction"
import { transactionKindOptions } from "./transaction-filter-fields"

/**
 * The phone's filters above the list, as in banking apps: the filter chip,
 * which opens the sheet of the other conditions (filled, with their count,
 * while any is on), then the kinds, one chosen. A tapped kind shows as chosen
 * at once while the page filters in a transition behind it, so the chip never
 * waits on the page re-rendering.
 */
export function TransactionKindChips({
  filter,
  onFilterChange,
  sheetFilterCount,
  onOpenFilters,
  onSearch,
  className,
}: {
  filter: TransactionFilter
  onFilterChange: (filter: TransactionFilter) => void
  /** How many of the sheet's conditions are on. */
  sheetFilterCount: number
  onOpenFilters: () => void
  /** The search chip first in the row (phones, 2026-10-21): the field no longer sits above the chips. */
  onSearch?: () => void
  className?: string
}) {
  // The chip shown as chosen: set at once on a tap, re-rendering only this
  // row; it follows the page's filter when that changes from elsewhere (the
  // sheet, "Bỏ lọc").
  const [shownFilter, setShownFilter] = React.useState(filter)
  const [pageFilter, setPageFilter] = React.useState(filter)
  if (pageFilter !== filter) {
    setPageFilter(filter)
    setShownFilter(filter)
  }
  const [, startTransition] = React.useTransition()

  return (
    <ChipRow className={className}>
      {onSearch ? (
        <ChipButton aria-label="Tìm giao dịch" onClick={onSearch} className="shrink-0 px-2.5">
          <SearchIcon />
        </ChipButton>
      ) : null}
      <ChipButton
        active={sheetFilterCount > 0}
        aria-label={sheetFilterCount > 0 ? `Bộ lọc, ${sheetFilterCount} điều kiện` : "Bộ lọc"}
        onClick={onOpenFilters}
        className="shrink-0"
      >
        <ListFilterIcon data-icon="inline-start" />
        {sheetFilterCount > 0 ? `Lọc · ${sheetFilterCount}` : "Lọc"}
      </ChipButton>
      <ChipRowDivider />
      <ToggleGroup
        type="single"
        size="sm"
        value={shownFilter}
        onValueChange={(value) => {
          if (!value) return
          setShownFilter(value as TransactionFilter)
          startTransition(() => onFilterChange(value as TransactionFilter))
        }}
        aria-label="Loại giao dịch"
        className="shrink-0"
      >
        {/* No "Vay nợ" chip beside the Vay nợ view (2026-10-21): two controls of one name did two things. Kept only while a link has chosen it. */}
        {transactionKindOptions.filter((item) => item.value !== "debt" || shownFilter === "debt").map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ChipRow>
  )
}
