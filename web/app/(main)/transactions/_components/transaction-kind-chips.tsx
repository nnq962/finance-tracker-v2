"use client"

import * as React from "react"
import { ChipRow } from "@/components/app/chip-row"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import type { TransactionFilter } from "../_types/transaction"
import { transactionKindOptions } from "./transaction-filter-fields"

/**
 * The phone's kinds above the list, as in banking apps, one chosen, each with
 * how many rows it would show ("Chi 12", 2026-10-24); search and the filter
 * sheet moved to round buttons beside the page's titles. A tapped kind shows as chosen
 * at once while the page filters in a transition behind it, so the chip never
 * waits on the page re-rendering.
 */
export function TransactionKindChips({
  filter,
  onFilterChange,
  counts,
  className,
}: {
  filter: TransactionFilter
  onFilterChange: (filter: TransactionFilter) => void
  /** Each kind's rows under every other filter. */
  counts: Record<TransactionFilter, number>
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
      <ToggleGroup
        type="single"
        size="sm"
        // White on the grey page, as the buttons beside the titles (2026-10-24).
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
        {/* No "Vay nợ" chip beside the Vay nợ view (2026-10-21): two controls of one name did two things. Kept only while a link has chosen it. */}
        {transactionKindOptions.filter((item) => item.value !== "debt" || shownFilter === "debt").map((item) => (
          <ToggleGroupItem key={item.value} value={item.value} className="gap-1.5">
            {item.label}
            {counts[item.value] > 0 ? <span className="tabular-nums opacity-55">{counts[item.value]}</span> : null}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ChipRow>
  )
}
