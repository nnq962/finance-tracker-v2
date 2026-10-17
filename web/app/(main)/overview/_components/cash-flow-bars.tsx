"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

import { compactMoney, type CashFlowMonth } from "../_lib/cash-flow-axis"

const cashFlowConfig = {
  income: { label: "Thu", color: "var(--income)" },
  // Spending is ordinary, not a warning: grey, as the calendar shows it; red stays for warnings.
  expense: { label: "Chi", color: "var(--chart-neutral)" },
} satisfies ChartConfig

/**
 * The drawing of the six months' bars, Recharts' part of the chart. In a file
 * of its own so Recharts (with d3, about 120 KB compressed) loads after the
 * page rather than with it (2026-10-17); CashFlowChart keeps the readout and
 * the month buttons, which render with the page.
 */
export function CashFlowBars({
  months,
  selected,
  ticks,
  yAxisWidth,
}: {
  months: CashFlowMonth[]
  selected: CashFlowMonth
  ticks: number[]
  yAxisWidth: number
}) {
  return (
    <ChartContainer config={cashFlowConfig} aria-hidden className="aspect-auto h-44 w-full sm:h-56">
      <BarChart
        data={months}
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
  )
}
