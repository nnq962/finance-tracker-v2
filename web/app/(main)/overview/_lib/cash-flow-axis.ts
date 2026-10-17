import type { OverviewSummary } from "@/lib/overview/summary"

export type CashFlowMonth = OverviewSummary["cashFlow"]["months"][number]

export function compactMoney(value: number) {
  const short = (amount: number, unit: string) => `${Number(amount.toFixed(2)).toLocaleString("vi-VN")}${unit}`
  if (value >= 1_000_000_000) return short(value / 1_000_000_000, "tỷ")
  if (value >= 1_000_000) return short(value / 1_000_000, "tr")
  if (value >= 1_000) return short(value / 1_000, "k")
  return String(value)
}

/**
 * Five marks from 0, a round step apart (1, 2, 2.5 or 5 times a power of
 * ten), the top one at or above the largest bar. Set here rather than left
 * to Recharts, so the axis can be as wide as its longest mark.
 */
export function axisTicks(months: CashFlowMonth[]) {
  const top = Math.max(1, ...months.flatMap((month) => [month.income, month.expense]))
  const raw = top / 4
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].find((factor) => factor * power >= raw)! * power
  return [0, 1, 2, 3, 4].map((index) => index * step)
}

/**
 * The Y axis's width for its marks (2026-10-17: a fixed 44 cut "1.800tr" to
 * ".800tr"): about 7px a character of the 12px labels, and room to breathe.
 * The month columns that take taps start right after it.
 */
export function axisWidth(ticks: number[]) {
  return Math.max(32, Math.max(...ticks.map((tick) => compactMoney(tick).length)) * 7 + 10)
}
