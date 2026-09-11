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
