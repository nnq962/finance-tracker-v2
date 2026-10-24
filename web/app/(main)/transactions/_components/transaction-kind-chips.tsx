"use client"

import * as React from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { TransactionFilter } from "../_types/transaction"
import { transactionKindOptions } from "./transaction-filter-fields"

/**
 * The phone's kinds above the list as a segmented control (2026-10-24, a
 * trial of the user's; flat white chips with counts before): Tất cả, Thu, Chi,
 * Chuyển khoản, one chosen. Each segment as wide as its name, so "Chuyển
 * khoản" fits a 390 screen. A tapped kind shows as chosen at once while the
 * page filters in a transition behind it, so the thumb never waits on the
 * page re-rendering. Search and the filter sheet are round buttons beside
 * the page's titles.
 */
export function TransactionKindChips({
  filter,
  onFilterChange,
  className,
}: {
  filter: TransactionFilter
  onFilterChange: (filter: TransactionFilter) => void
  className?: string
}) {
  // The kind shown as chosen: set at once on a tap, re-rendering only this
  // control; it follows the page's filter when that changes from elsewhere
  // (the sheet, "Bỏ lọc").
  const [shownFilter, setShownFilter] = React.useState(filter)
  const [pageFilter, setPageFilter] = React.useState(filter)
  if (pageFilter !== filter) {
    setPageFilter(filter)
    setShownFilter(filter)
  }
  const [, startTransition] = React.useTransition()

  return (
    <Tabs
      value={shownFilter}
      onValueChange={(value) => {
        setShownFilter(value as TransactionFilter)
        startTransition(() => onFilterChange(value as TransactionFilter))
      }}
      className={className}
    >
      <TabsList variant="segmented" className="w-full" aria-label="Loại giao dịch">
        {/* No "Vay nợ" beside the Vay nợ view (2026-10-21): two controls of one name did two things. Kept only while a link has chosen it. */}
        {transactionKindOptions.filter((item) => item.value !== "debt" || shownFilter === "debt").map((item) => (
          <TabsTrigger key={item.value} value={item.value} className="flex-auto px-2">
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
