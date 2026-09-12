import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"

type SummaryCardProps = {
  label: string
  value: number
  signDisplay?: "auto" | "always" | "never"
  tone?: "default" | "income" | "expense"
}

const valueTone = {
  default: "",
  income: "text-emerald-600 dark:text-emerald-400",
  expense: "text-rose-600 dark:text-rose-400",
} satisfies Record<NonNullable<SummaryCardProps["tone"]>, string>

export function SummaryCard({
  label,
  value,
  signDisplay = "auto",
  tone = "default",
}: SummaryCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-3">
        <CardDescription>{label}</CardDescription>
        <p
          className={`text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${valueTone[tone]}`}
        >
          {formatCurrency(value, { signDisplay })}
        </p>
      </CardContent>
    </Card>
  )
}
