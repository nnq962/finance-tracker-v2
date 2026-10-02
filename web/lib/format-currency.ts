type CurrencySignDisplay = "auto" | "always" | "never"

type FormatCurrencyOptions = {
  signDisplay?: CurrencySignDisplay
}

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
})

export function formatCurrency(
  amount: number,
  { signDisplay = "auto" }: FormatCurrencyOptions = {},
) {
  const sign =
    signDisplay === "never"
      ? ""
      : amount < 0
        ? "-"
        : amount > 0 && signDisplay === "always"
          ? "+"
          : ""

  return `${sign}${numberFormatter.format(Math.abs(amount))}đ`
}

/**
 * Short amounts for where the full one does not fit: 460k, 1,2tr, 25tr,
 * 1,5tỷ. `extraDigits` keeps more decimals where there is a little more room
 * (128,5tr rather than 128tr).
 */
export function formatCompactCurrency(value: number, extraDigits = 0) {
  const format = (amount: number, unit: string) =>
    `${Number(amount.toFixed((amount < 10 ? 1 : 0) + extraDigits)).toLocaleString("vi-VN")}${unit}`

  if (value >= 1_000_000_000) return format(value / 1_000_000_000, "tỷ")
  if (value >= 1_000_000) return format(value / 1_000_000, "tr")
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return `${value}đ`
}
