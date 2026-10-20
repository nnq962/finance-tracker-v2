"use client"

import { Cell, Label, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"

import type { AllocationSlice } from "../_lib/allocation-slices"

const chartConfig = { amount: { label: "Số tiền" } } satisfies ChartConfig

/**
 * The categories' ring with the total in its middle, Recharts' part of the
 * breakdown. In a file of its own so Recharts loads after the page rather
 * than with it (2026-10-17).
 */
export function CategoryDonut({
  slices,
  total,
  typeLabel,
}: {
  slices: AllocationSlice[]
  total: number
  /** "chi" or "thu". */
  typeLabel: string
}) {
  return (
    <ChartContainer config={chartConfig} aria-hidden="true" className="aspect-square w-32 shrink-0">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="name"
              formatter={(value, _name, item) => (
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">{item.payload.name}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <Pie
          data={slices}
          dataKey="amount"
          nameKey="name"
          innerRadius="74%"
          outerRadius="100%"
          // Largest first, clockwise from twelve o'clock.
          startAngle={90}
          endAngle={-270}
          cornerRadius={4}
          // A gap in the card's colour between slices; a lone slice
          // is a full ring with no seam.
          stroke="var(--card)"
          strokeWidth={slices.length > 1 ? 2 : 0}
          // Drawn at once, never swept in: while the slices grow from
          // nothing, iOS Safari takes a tap anywhere on the page as a
          // hover over appearing content and sends no click, so the
          // page's links missed taps for the ~2s the sweep took each
          // time the overview opened.
          isAnimationActive={false}
        >
          {slices.map((slice) => (
            <Cell key={slice.key} fill={slice.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null
              const cy = viewBox.cy ?? 0
              return (
                <text x={viewBox.cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={cy - 7} className="fill-foreground text-lg font-semibold tabular-nums">
                    {formatCompactCurrency(total, 1)}
                  </tspan>
                  <tspan x={viewBox.cx} y={cy + 13} className="fill-muted-foreground text-xs">
                    Tổng {typeLabel}
                  </tspan>
                </text>
              )
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
