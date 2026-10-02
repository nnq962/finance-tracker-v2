"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"

// Validated with the dataviz palette checker: light pair CVD ΔE 10.0; the
// dark pair (7.4) relies on the legend dots and the 2px gap between bars.
export const cashFlowChartColors = {
  income: { light: "#3e9727", dark: "#3e9727" },
  expense: { light: "#ff837e", dark: "#f2564f" },
} as const

const cashFlowConfig = {
  income: { label: "Thu", theme: cashFlowChartColors.income },
  expense: { label: "Chi", theme: cashFlowChartColors.expense },
} satisfies ChartConfig

function compactMoney(value: number) {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}tr`
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(0))}k`
  return String(value)
}

export function CashFlowChart({ data }: { data: OverviewSummary["cashFlow"] }) {
  return (
    <>
      <ChartContainer config={cashFlowConfig} className="aspect-auto h-48 w-full sm:h-56">
        <BarChart
          data={data.months}
          accessibilityLayer
          barGap={2}
          barCategoryGap="28%"
          margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickFormatter={compactMoney}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex min-w-36 items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: `var(--color-${name})` }}
                        aria-hidden="true"
                      />
                      {name === "income" ? "Thu" : "Chi"}
                    </span>
                    <strong className="font-medium tabular-nums">
                      {formatCurrency(Number(value))}
                    </strong>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ChartContainer>
      {/* sr-only on a div: a table cannot shrink to 1px and would stretch the
          page's scroll area below the content. */}
      <div className="sr-only">
        <table>
          <caption>Thu và chi 6 tháng gần nhất</caption>
          <thead>
            <tr><th>Tháng</th><th>Thu</th><th>Chi</th></tr>
          </thead>
          <tbody>
            {data.months.map((month) => (
              <tr key={month.key}>
                <td>{month.label}</td>
                <td>{formatCurrency(month.income)}</td>
                <td>{formatCurrency(month.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
