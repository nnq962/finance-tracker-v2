import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

type MoneyProps = {
  amount: number
  signDisplay?: "auto" | "always" | "never"
  className?: string
}

/**
 * An amount with its "đ" lighter than the digits, as large figures are set
 * in the minimal design.
 */
export function Money({ amount, signDisplay = "auto", className }: MoneyProps) {
  const text = formatCurrency(amount, { signDisplay })
  const digits = text.endsWith("đ") ? text.slice(0, -1) : text

  return (
    <span className={cn("tabular-nums", className)}>
      {digits}
      <span className="opacity-40">đ</span>
    </span>
  )
}
