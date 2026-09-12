"use client"

import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import type { TransactionFilter } from "../_types/transaction"

const filters: { label: string; value: TransactionFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chi tiền", value: "expense" },
  { label: "Thu tiền", value: "income" },
  { label: "Chuyển khoản", value: "transfer" },
  { label: "Vay nợ", value: "loan" },
]

type TransactionToolbarProps = {
  filter: TransactionFilter
  query: string
  onFilterChange: (filter: TransactionFilter) => void
  onQueryChange: (query: string) => void
}

export function TransactionToolbar({
  filter,
  query,
  onFilterChange,
  onQueryChange,
}: TransactionToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="overflow-x-auto pb-1">
        <ToggleGroup
          type="single"
          variant="outline"
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
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="relative w-full lg:max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="pl-9"
          placeholder="Tìm giao dịch..."
          aria-label="Tìm giao dịch"
        />
      </div>
    </div>
  )
}
