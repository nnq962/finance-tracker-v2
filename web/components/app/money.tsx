import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const numberFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 })

const moneyVariants = cva("inline-flex min-w-0 items-baseline font-medium tabular-nums [overflow-wrap:anywhere]", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-2xl tracking-tight",
      xl: "text-4xl tracking-tight",
    },
    tone: {
      default: "",
      income: "text-income",
      expense: "text-expense",
      transfer: "text-transfer",
    },
  },
  defaultVariants: { size: "md", tone: "default" },
})

type MoneyProps = {
  amount: number
  /** auto: a minus sign below zero; always: + above zero too; never: no sign. */
  sign?: "auto" | "always" | "never"
  className?: string
} & VariantProps<typeof moneyVariants>

/**
 * An amount of money as a figure rather than text: tabular digits, the sign
 * in the amount's colour, and a smaller, muted đ, so the eye reads the number
 * first.
 */
export function Money({ amount, sign = "auto", size, tone, className }: MoneyProps) {
  const prefix = sign === "never" ? "" : amount < 0 ? "−" : amount > 0 && sign === "always" ? "+" : ""

  return (
    <span data-slot="money" className={cn(moneyVariants({ size, tone }), className)}>
      {prefix}
      {numberFormatter.format(Math.abs(amount))}
      <span className={cn("ml-0.5 text-[0.7em]", tone && tone !== "default" ? "opacity-55" : "text-muted-foreground")}>
        đ
      </span>
    </span>
  )
}
