"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Money } from "@/components/app/money"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"

const cashFlowConfig = {
  income: { label: "Thu", color: "var(--income)" },
  // Spending is ordinary, not a warning: grey, as the calendar shows it; red stays for warnings.
  expense: { label: "Chi", color: "var(--chart-neutral)" },
} satisfies ChartConfig

type CashFlowMonth = OverviewSummary["cashFlow"]["months"][number]

function compactMoney(value: number) {
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
function axisTicks(months: CashFlowMonth[]) {
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
function axisWidth(ticks: number[]) {
  return Math.max(32, Math.max(...ticks.map((tick) => compactMoney(tick).length)) * 7 + 10)
}

/**
 * The selected month's figures, read out above the bars in place of a
 * floating tooltip. The month and the figures always take two lines, so the
 * bars stay put under the finger whatever the amounts' length: each figure
 * has half the width and fits it (from 1 tỷ up they wrapped at 360px,
 * 2026-10-17).
 */
function MonthReadout({ month }: { month: CashFlowMonth }) {
  return (
    <div aria-live="polite" aria-atomic className="flex flex-col gap-0.5">
      <p className="font-medium">{month.name}</p>
      <dl className="grid grid-cols-2 gap-x-3">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <dt className="text-xs text-muted-foreground">Thu</dt>
          <dd className="@container min-w-0 flex-1">
            <Money amount={month.income} size="sm" fit tone={month.income > 0 ? "income" : "default"} />
          </dd>
        </div>
        <div className="flex min-w-0 items-baseline gap-1.5">
          <dt className="text-xs text-muted-foreground">Chi</dt>
          <dd className="@container min-w-0 flex-1">
            <Money amount={month.expense} size="sm" fit />
          </dd>
        </div>
      </dl>
    </div>
  )
}

/**
 * Income and expenses for each of the last six months. A tap on a month
 * selects it, as in a native chart: its figures show in the readout and its
 * column is shaded. The current month is selected to begin with.
 */
export function CashFlowChart({ data }: { data: OverviewSummary["cashFlow"] }) {
  const [selectedKey, setSelectedKey] = React.useState<string>()
  const found = data.months.findIndex((month) => month.key === selectedKey)
  // The last month is the current one.
  const selectedIndex = found === -1 ? data.months.length - 1 : found
  const selected = data.months[selectedIndex]
  const ticks = axisTicks(data.months)
  const yAxisWidth = axisWidth(ticks)

  return (
    <div className="flex flex-col gap-4">
      <MonthReadout month={selected} />
      <div className="relative">
        {/* The month buttons below and the table after them are what assistive
            technology reads; the drawing itself is hidden from it. */}
        <ChartContainer config={cashFlowConfig} aria-hidden className="aspect-auto h-44 w-full sm:h-56">
          <BarChart
            data={data.months}
            accessibilityLayer={false}
            barGap={3}
            barCategoryGap="28%"
            margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
          >
            {/* No vertical lines, so none are worked out (which measures labels). */}
            <CartesianGrid vertical={false} verticalCoordinatesGenerator={() => []} strokeDasharray="3 4" />
            {/* interval={0}: every tick, so Recharts does not measure each label
                in the DOM to drop overlapping ones. Six short months and five
                amounts always fit, and the measuring forced a layout of the
                whole page per label, holding up taps while the overview opened. */}
            <XAxis
              dataKey="label"
              interval={0}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              // The selected month's name stands out, so an empty month still shows as chosen.
              // A plain <text> rather than Recharts' Text, which measures each
              // label in the DOM to wrap it; a month's name never wraps. 0.71em
              // hangs it below y, as Text's verticalAnchor="start" does.
              tick={({ payload, x, y, textAnchor, className }) => (
                <text
                  x={x}
                  y={y}
                  dy="0.71em"
                  textAnchor={textAnchor}
                  className={className}
                  data-active={payload.value === selected.label || undefined}
                >
                  {payload.value}
                </text>
              )}
            />
            <YAxis
              interval={0}
              ticks={ticks}
              domain={[0, ticks[ticks.length - 1]]}
              // Plain <text>, as on the X axis; 0.355em centres it on y.
              tick={({ payload, x, y, textAnchor, className }) => (
                <text x={x} y={y} dy="0.355em" textAnchor={textAnchor} className={className}>
                  {compactMoney(payload.value)}
                </text>
              )}
              tickLine={false}
              axisLine={false}
              width={yAxisWidth}
            />
            {/* Phones stay below the cap; it only keeps bars from growing too wide on desktop. */}
            <Bar
              dataKey="income"
              fill="var(--color-income)"
              radius={[6, 6, 2, 2]}
              maxBarSize={28}
              // No growing in: see the categories' ring (iOS drops taps then).
              isAnimationActive={false}
            />
            <Bar
              dataKey="expense"
              fill="var(--color-expense)"
              radius={[6, 6, 2, 2]}
              maxBarSize={28}
              // No growing in: see the categories' ring (iOS drops taps then).
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        {/* A month's whole column, labels included, takes the tap: the bars
            alone are too thin to aim at, and an empty month has none. The
            columns match the X axis's equal bands right of the Y axis. A
            radio group, so arrow keys move the choice along with the focus. */}
        <RadioGroupPrimitive.Root
          value={selected.key}
          onValueChange={setSelectedKey}
          aria-label="Chọn tháng"
          className="absolute inset-y-0 right-0 flex"
          style={{ left: yAxisWidth }}
        >
          {data.months.map((month) => (
            <RadioGroupPrimitive.Item
              key={month.key}
              value={month.key}
              aria-label={month.name}
              // The chosen month's column is shaded, as in Health: the bars keep
              // full colour, so every month stays readable against the card.
              className="min-w-0 flex-1 rounded-xl outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/30 data-[state=checked]:bg-foreground/5 motion-reduce:transition-none"
            />
          ))}
        </RadioGroupPrimitive.Root>
      </div>
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
                <td>{month.name}</td>
                <td>{formatCurrency(month.income)}</td>
                <td>{formatCurrency(month.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
