"use client"

import { ListFilterIcon } from "lucide-react"

import { ChipButton, ChipRow, ChipRowDivider } from "@/components/app/chip-row"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import type { TransactionFilter } from "../_types/transaction"
import { transactionKindOptions } from "./transaction-filter-fields"

/**
 * The phone's filters above the list, as in banking apps: the filter chip,
 * which opens the sheet of the other conditions (filled, with their count,
 * while any is on), then the kinds, one chosen.
 */
export function TransactionKindChips({
  filter,
  onFilterChange,
  sheetFilterCount,
  onOpenFilters,
  className,
}: {
  filter: TransactionFilter
  onFilterChange: (filter: TransactionFilter) => void
  /** How many of the sheet's conditions are on. */
  sheetFilterCount: number
  onOpenFilters: () => void
  className?: string
}) {
  return (
    <ChipRow className={className}>
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
        value={filter}
        onValueChange={(value) => {
          if (value) onFilterChange(value as TransactionFilter)
        }}
        aria-label="Loại giao dịch"
        className="shrink-0"
      >
        {transactionKindOptions.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ChipRow>
  )
}
