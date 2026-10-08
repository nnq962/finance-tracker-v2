"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatCurrency } from "@/lib/format-currency"

type AmountSuggestionsProps = {
  suggestions: number[]
  value: number | null
  onSelect: (amount: number) => void
  "aria-label"?: string
}

/** Quick-pick chips, as CurrencyInput shows them under itself; renders nothing without suggestions. */
export function AmountSuggestions({
  suggestions,
  value,
  onSelect,
  "aria-label": ariaLabel = "Gợi ý số tiền",
}: AmountSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="-mx-1 min-w-0 overflow-x-auto px-1 pt-1 pb-1">
      <ToggleGroup
        type="single"
        size="sm"
        value={value !== null && suggestions.includes(value) ? String(value) : ""}
        onValueChange={(next) => {
          if (next) onSelect(Number(next))
        }}
        aria-label={ariaLabel}
      >
        {suggestions.map((amount) => (
          <ToggleGroupItem key={amount} value={String(amount)}>
            {formatCurrency(amount)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
