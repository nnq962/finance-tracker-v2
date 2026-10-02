import { MAX_MONEY } from "@/lib/money"

export const MAX_AMOUNT = MAX_MONEY
export const MAX_AMOUNT_SUGGESTIONS = 5

const MAX_HISTORY_MATCHES = 2
// Typed digits read as thousands, like Vietnamese banking apps: 30 -> 30.000đ.
const BASE_MULTIPLIER = 1_000

/**
 * Distinct amounts ordered by how often they occur. Ties keep the order of
 * `amounts`, so pass the newest first to prefer recent amounts.
 */
export function getFrequentAmounts(amounts: number[]) {
  const counts = new Map<number, number>()

  for (const amount of amounts) {
    if (!Number.isSafeInteger(amount) || amount <= 0) continue
    counts.set(amount, (counts.get(amount) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([amount]) => amount)
}

/**
 * Quick-pick amounts for what has been typed so far.
 *
 * - Nothing typed: the most frequent amounts from history.
 * - Typed digits: up to two frequent past amounts starting with those digits,
 *   then the digits scaled to thousands, ten thousands, and so on.
 *
 * Results are unique, never equal to the typed value, within the allowed
 * range, and sorted ascending.
 */
export function getAmountSuggestions(
  typed: number | null,
  historyAmounts: number[],
  limit = MAX_AMOUNT_SUGGESTIONS,
) {
  const frequent = getFrequentAmounts(historyAmounts)

  if (typed === null || typed <= 0) {
    return frequent.slice(0, limit).sort((left, right) => left - right)
  }

  const digits = String(typed)
  const fromHistory = frequent
    .filter((amount) => amount !== typed && String(amount).startsWith(digits))
    .slice(0, MAX_HISTORY_MATCHES)
  const scaled: number[] = []

  for (
    let amount = typed * BASE_MULTIPLIER;
    amount <= MAX_AMOUNT && scaled.length < limit;
    amount *= 10
  ) {
    scaled.push(amount)
  }

  return [...new Set([...fromHistory, ...scaled])]
    .filter((amount) => amount !== typed && amount <= MAX_AMOUNT)
    .slice(0, limit)
    .sort((left, right) => left - right)
}
