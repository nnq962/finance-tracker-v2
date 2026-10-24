"use client"

import * as React from "react"
import { ListFilterIcon } from "lucide-react"

import { ChipButton, ChipRow, ChipRowDivider } from "@/components/app/chip-row"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import type { TransactionFilter } from "../_types/transaction"
import { transactionKindOptions } from "./transaction-filter-fields"

/**
 * The phone's kinds above the list as chips (2026-10-24, back from a
 * segmented control: with Chi tiêu | Vay nợ now a segmented control in the
 * page's bar, two on one screen read as one kind of thing): Tất cả, Thu, Chi,
 * Chuyển khoản, one chosen, white on the grey page as the buttons are; no
 * counts. The row opens with the filter sheet's chip ("Lọc", "Lọc · 2" and
 * filled while filters narrow the list) and a divider, as ChipRow shows in
 * /design; the row scrolls to the screen's edges. A tapped kind shows
 * as chosen at once while the page filters in a transition behind it, so the
 * chip never waits on the page re-rendering.
 */
export function TransactionKindChips({
  filter,
  onFilterChange,
  filterCount,
  onOpenFilters,
  className,
}: {
  filter: TransactionFilter
  onFilterChange: (filter: TransactionFilter) => void
  /** How many of the sheet's filters are in force. */
  filterCount: number
  onOpenFilters: () => void
  className?: string
}) {
  // The kind shown as chosen: set at once on a tap, re-rendering only this
  // row; it follows the page's filter when that changes from elsewhere
  // (the sheet, "Bỏ lọc").
  const [shownFilter, setShownFilter] = React.useState(filter)
  const [pageFilter, setPageFilter] = React.useState(filter)
  if (pageFilter !== filter) {
    setPageFilter(filter)
    setShownFilter(filter)
  }
  const [, startTransition] = React.useTransition()

  return (
    <ChipRow className={className}>
      <ChipButton
        variant="elevated"
        active={filterCount > 0}
        aria-label={filterCount > 0 ? `Bộ lọc, ${filterCount} điều kiện` : "Bộ lọc"}
        onClick={onOpenFilters}
      >
        <ListFilterIcon data-icon="inline-start" />
        {filterCount > 0 ? `Lọc · ${filterCount}` : "Lọc"}
      </ChipButton>
      <ChipRowDivider />
      <ToggleGroup
        type="single"
        size="sm"
        variant="elevated"
        value={shownFilter}
        onValueChange={(value) => {
          if (!value) return
          setShownFilter(value as TransactionFilter)
          startTransition(() => onFilterChange(value as TransactionFilter))
        }}
        aria-label="Loại giao dịch"
        className="shrink-0"
      >
        {/* No "Vay nợ" beside the Vay nợ view (2026-10-21): two controls of one name did two things. Kept only while a link has chosen it. */}
        {transactionKindOptions.filter((item) => item.value !== "debt" || shownFilter === "debt").map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ChipRow>
  )
}
