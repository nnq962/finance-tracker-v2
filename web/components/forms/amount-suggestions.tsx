"use client"

import * as React from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getAmountSuggestions } from "@/lib/amount-suggestions"
import { formatCurrency } from "@/lib/format-currency"

/**
 * Amount state for a CurrencyInput with quick picks. Suggestions follow what
 * was typed, not the picked value, so choosing a chip keeps the row in place
 * and highlights the choice instead of replacing it with bigger amounts.
 */
export function useAmountQuickPick(
  initialAmount: number | null,
  historyAmounts: number[],
) {
  const [amount, setAmount] = React.useState(initialAmount)
  const [typedAmount, setTypedAmount] = React.useState<number | null>(null)
  const suggestions = React.useMemo(
    () => getAmountSuggestions(typedAmount, historyAmounts),
    [historyAmounts, typedAmount],
  )

  return {
    amount,
    suggestions,
    onType: (value: number | null) => {
      setAmount(value)
      setTypedAmount(value)
    },
    onPick: setAmount,
    /** Restores a value and clears the typed digits, e.g. when a sheet reopens. */
    reset: (value: number | null) => {
      setAmount(value)
      setTypedAmount(null)
    },
  }
}

type AmountSuggestionsProps = {
  suggestions: number[]
  value: number | null
  onSelect: (amount: number) => void
  "aria-label"?: string
}

/** Quick-pick chips under a CurrencyInput; renders nothing without suggestions. */
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
