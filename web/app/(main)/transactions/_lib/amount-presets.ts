import { formatCompactCurrency } from "@/lib/format-currency"

import type { TransactionSearchFilters } from "../_types/transaction"

/** Amount ranges picked with one tap; anything else is typed under "Tuỳ chỉnh". */
export const amountPresets = [
  { key: "any", label: "Bất kỳ", min: null, max: null },
  { key: "under-100k", label: "Dưới 100k", min: null, max: 100_000 },
  { key: "100k-1m", label: "100k – 1tr", min: 100_000, max: 1_000_000 },
  { key: "over-1m", label: "Trên 1tr", min: 1_000_000, max: null },
] as const

export type AmountPreset = (typeof amountPresets)[number]

/** The preset the range is, if it is one. */
export function amountPreset({ minAmount, maxAmount }: Pick<TransactionSearchFilters, "minAmount" | "maxAmount">) {
  return amountPresets.find((preset) => preset.min === minAmount && preset.max === maxAmount)
}

/** What the amount condition is, in a few words: "Bất kỳ", "Dưới 100k", "Từ 50k", "50k – 2tr". */
export function amountSummary(searchFilters: Pick<TransactionSearchFilters, "minAmount" | "maxAmount">) {
  const preset = amountPreset(searchFilters)
  if (preset) return preset.label
  const { minAmount, maxAmount } = searchFilters
  if (minAmount !== null && maxAmount !== null) return `${formatCompactCurrency(minAmount)} – ${formatCompactCurrency(maxAmount)}`
  if (minAmount !== null) return `Từ ${formatCompactCurrency(minAmount)}`
  return `Đến ${formatCompactCurrency(maxAmount ?? 0)}`
}
