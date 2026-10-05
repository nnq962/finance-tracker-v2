"use client"

import * as React from "react"
import { ReceiptTextIcon } from "lucide-react"
import { Cell, Label, Pie, PieChart } from "recharts"

import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup, CategoryType } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import type { MonthAllocation } from "@/lib/overview/month-data"
import { cn } from "@/lib/utils"

// Five groups and the rest folded into one neutral "Khác" slice.
const MAX_SLICES = 5
const OTHER_COLOR: CategoryColorName = "slate"

const chartConfig = { amount: { label: "Số tiền" } } satisfies ChartConfig

type Slice = {
  key: string
  name: string
  amount: number
  share: number
  color: CategoryColorName
  group?: CategoryGroup
  fill: string
}

type AllocationDonutProps = {
  categoryGroups: CategoryGroup[]
  /** Totals per month and category group, summed on the server. */
  allocation: Record<string, MonthAllocation>
  /** "YYYY-MM", the month shown by the calendar. */
  month: string
}

/**
 * How a month's income or expenses split across category groups. Loans are
 * left out: borrowing and lending are not income or spending.
 */
export function AllocationDonut({ categoryGroups, allocation, month }: AllocationDonutProps) {
  const [type, setType] = React.useState<CategoryType>("expense")
  const groupsById = new Map(categoryGroups.map((group) => [group.id, group]))

  const totals = Object.entries(allocation[month]?.[type] ?? {})
  const total = totals.reduce((sum, [, amount]) => sum + amount, 0)
  const ranked = totals.sort((left, right) => right[1] - left[1])
  const visible = ranked.length > MAX_SLICES + 1 ? ranked.slice(0, MAX_SLICES) : ranked
  const restAmount = ranked.slice(visible.length).reduce((sum, [, amount]) => sum + amount, 0)
  const toShare = (amount: number) => (total > 0 ? Math.round((amount / total) * 100) : 0)

  const slices: Slice[] = visible.map(([key, amount]) => {
    const group = groupsById.get(key)
    const color = group?.colorName ?? OTHER_COLOR
    return {
      key,
      name: group?.name ?? "Chưa phân loại",
      amount,
      share: toShare(amount),
      color,
      group,
      fill: getCategoryColor(color).chartFill,
    }
  })
  if (restAmount > 0) {
    slices.push({
      key: "rest",
      name: `Khác (${ranked.length - visible.length} nhóm)`,
      amount: restAmount,
      share: toShare(restAmount),
      color: OTHER_COLOR,
      fill: getCategoryColor(OTHER_COLOR).chartFill,
    })
  }

  const [year, monthNumber] = month.split("-").map(Number)
  const typeLabel = type === "expense" ? "chi" : "thu"

  return (
    <section aria-labelledby="allocation-title" className="space-y-2">
      <h2
        id="allocation-title"
        className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        Phân bổ · Tháng {monthNumber}/{year}
      </h2>
      {/* One card: the chart, then its legend, where each row's icon has
          its slice's colour. */}
      <Card size="sm" className="gap-0 py-0">
        <div className="space-y-4 p-4">
          <Tabs value={type} onValueChange={(value) => setType(value as CategoryType)}>
            <TabsList className="w-full">
              <TabsTrigger value="expense">Chi tiền</TabsTrigger>
              <TabsTrigger value="income">Thu tiền</TabsTrigger>
            </TabsList>
          </Tabs>
          {slices.length > 0 ? (
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-56">
              <PieChart accessibilityLayer>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="name"
                      formatter={(value, _name, item) => (
                        <span className="flex w-full items-center justify-between gap-3">
                          <span className="text-muted-foreground">{item.payload.name}</span>
                          <span className="font-mono font-medium tabular-nums">
                            {formatCurrency(Number(value))} · {item.payload.share}%
                          </span>
                        </span>
                      )}
                    />
                  }
                />
                <Pie
                  data={slices}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="92%"
                  // Largest first, clockwise from twelve o'clock.
                  startAngle={90}
                  endAngle={-270}
                  cornerRadius={4}
                  // A 2px gap in the card's colour between slices; a lone
                  // slice is a full ring with no seam.
                  stroke="var(--card)"
                  strokeWidth={slices.length > 1 ? 2 : 0}
                  isAnimationActive={false}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.key} fill={slice.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox)) return null
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) - 8}
                            className="fill-foreground font-heading text-base font-extrabold"
                          >
                            {formatCurrency(total)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 14}
                            className="fill-muted-foreground text-xs"
                          >
                            tổng {typeLabel}
                          </tspan>
                        </text>
                      )
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có khoản {typeLabel} trong tháng này.
            </p>
          )}
        </div>
        {/* Legend rows as in the landing page's preview: no dividers, the
            icon tile in the group's colour, the amount on the right. */}
        {slices.length > 0 ? (
          <ul className="space-y-1 px-3 pb-3">
            {slices.map((slice) => {
              const Icon = slice.group ? categoryIconRegistry[slice.group.iconName] : ReceiptTextIcon
              return (
                <li key={slice.key} className="flex items-center gap-3 rounded-xl px-1 py-2">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      getCategoryColor(slice.color).surfaceClassName,
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading font-extrabold">{slice.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {slice.share}% tổng {typeLabel}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatCurrency(slice.amount)}</span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </Card>
    </section>
  )
}
