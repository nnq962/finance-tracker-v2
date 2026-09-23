import { ArrowDownLeftIcon, ArrowUpRightIcon, ScaleIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"

import type { DebtSummaryData } from "../_types/debt"

type DebtSummaryProps = {
  summary: DebtSummaryData
}

export function DebtSummary({ summary }: DebtSummaryProps) {
  const items = [
    {
      label: "Người khác nợ tôi",
      helper: "Tổng đang cho vay",
      value: summary.totalLent,
      icon: ArrowUpRightIcon,
      surfaceClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueClassName: "text-emerald-600 dark:text-emerald-400",
      dotClassName: "bg-emerald-500",
    },
    {
      label: "Tôi đang nợ",
      helper: "Tổng đang đi vay",
      value: summary.totalBorrowed,
      icon: ArrowDownLeftIcon,
      surfaceClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      valueClassName: "text-rose-600 dark:text-rose-400",
      dotClassName: "bg-rose-500",
    },
    {
      label: "Cân đối ròng",
      helper: summary.netBalance === 0 ? "Các khoản vay đang cân bằng" : summary.netBalance > 0 ? "Bạn được nợ nhiều hơn" : "Bạn nợ nhiều hơn",
      value: summary.netBalance,
      icon: ScaleIcon,
      surfaceClassName:
        summary.netBalance >= 0
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      valueClassName:
        summary.netBalance >= 0
          ? "text-blue-600 dark:text-blue-400"
          : "text-amber-600 dark:text-amber-400",
      dotClassName: summary.netBalance >= 0 ? "bg-blue-500" : "bg-amber-500",
    },
  ]

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {items.map(({
        label,
        helper,
        value,
        icon: Icon,
        surfaceClassName,
        valueClassName,
        dotClassName,
      }) => (
        <Card key={label}>
          <CardHeader className="grid grid-cols-[1fr_auto] items-center">
            <CardTitle className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${dotClassName}`} />
              {label}
            </CardTitle>
            <span className={`flex size-9 items-center justify-center rounded-lg ${surfaceClassName}`}>
              <Icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold tabular-nums ${valueClassName}`}>
              {formatCurrency(value, { signDisplay: label === "Cân đối ròng" && value !== 0 ? "always" : "auto" })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
