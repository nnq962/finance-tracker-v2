"use client"

import * as React from "react"
import { Cell, Label, Pie, PieChart } from "recharts"

import { Section } from "@/components/app/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CategoryGroup, CategoryType } from "@/lib/categories/types"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import type { MonthAllocation } from "@/lib/overview/month-data"

import { allocationSlices } from "../_lib/allocation-slices"

const chartConfig = { amount: { label: "Số tiền" } } satisfies ChartConfig

/**
 * The month's spending or income by category group: a ring with the total in
 * its middle, and beside it each group's colour, name and share.
 */
export function CategoryBreakdown({
  categoryGroups,
  allocation,
  month,
}: {
  categoryGroups: CategoryGroup[]
  allocation: Record<string, MonthAllocation>
  /** "YYYY-MM", the month chosen above. */
  month: string
}) {
  const [type, setType] = React.useState<CategoryType>("expense")
  const { slices, total } = allocationSlices(categoryGroups, allocation, month, type)
  const typeLabel = type === "expense" ? "chi" : "thu"

  return (
    <Section title="Theo hạng mục" href="/transactions">
      <Tabs value={type} onValueChange={(value) => setType(value as CategoryType)}>
        <TabsList className="w-full">
          <TabsTrigger value="expense">Chi tiêu</TabsTrigger>
          <TabsTrigger value="income">Thu nhập</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card size="lg">
        <CardContent>
          {slices.length > 0 ? (
            <div className="flex items-center gap-6">
              {/* The list beside it says the same for screen readers. */}
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
                            <tspan x={viewBox.cx} y={cy - 7} className="fill-foreground text-base font-medium">
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
              <ul className="min-w-0 flex-1 space-y-2.5">
                {slices.map((slice) => (
                  <li key={slice.key} title={formatCurrency(slice.amount)} className="flex items-center gap-2 text-sm">
                    <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} />
                    <span className="min-w-0 flex-1 truncate">{slice.name}</span>
                    <span className="sr-only">{formatCurrency(slice.amount)},</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{slice.share}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Empty className="p-4">
              <EmptyHeader>
                <EmptyDescription>Chưa có khoản {typeLabel} tháng này</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </Section>
  )
}
