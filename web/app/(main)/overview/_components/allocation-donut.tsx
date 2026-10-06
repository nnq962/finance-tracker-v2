"use client"

import * as React from "react"
import { CircleHelpIcon, EllipsisIcon, type LucideIcon } from "lucide-react"
import { Cell, Label, Pie, PieChart } from "recharts"

import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"

import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup, CategoryType } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import type { MonthAllocation } from "@/lib/overview/month-data"

// Five groups and the rest folded into one neutral "Khác" slice.
const MAX_SLICES = 5
const OTHER_COLOR: CategoryColorName = "slate"

const chartConfig = { amount: { label: "Số tiền" } } satisfies ChartConfig

type Slice = {
  key: string
  icon: LucideIcon
  name: string
  amount: number
  share: number
  color: CategoryColorName
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
      icon: group ? categoryIconRegistry[group.iconName] : CircleHelpIcon,
      name: group?.name ?? "Chưa phân loại",
      amount,
      share: toShare(amount),
      color,
      fill: getCategoryColor(color).chartFill,
    }
  })
  if (restAmount > 0) {
    slices.push({
      key: "rest",
      icon: EllipsisIcon,
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
    <Card size="lg" role="region" aria-labelledby="allocation-title">
      <CardContent className="space-y-4">
        <h2 id="allocation-title" className="flex items-baseline justify-between gap-3">
          <span className="font-medium">Phân bổ</span>
          <span className="text-sm text-muted-foreground">
            Tháng {monthNumber}/{year}
          </span>
        </h2>
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
                innerRadius="76%"
                outerRadius="92%"
                // Largest first, clockwise from twelve o'clock.
                startAngle={90}
                endAngle={-270}
                cornerRadius={6}
                // A 3px gap in the card's colour between slices; a lone
                // slice is a full ring with no seam.
                stroke="var(--card)"
                strokeWidth={slices.length > 1 ? 3 : 0}
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
                          className="fill-foreground text-base font-medium"
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
          <Empty>
            <EmptyHeader>
              <EmptyDescription>Chưa có khoản {typeLabel} trong tháng này.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      {/* The groups as rows below the chart: each tile has its slice's
          colour, and a thin bar its share. */}
      {slices.length > 0 ? (
        <CardContent>
          <ul className="space-y-1">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center gap-3.5 py-1.5">
                <IconTile icon={slice.icon} tone={slice.color} size="lg" shape="rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{slice.name}</p>
                  <div className="mt-2 h-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(slice.share, 2)}%`, backgroundColor: slice.fill }}
                    />
                  </div>
                </div>
                <div className="w-28 shrink-0 border-l pl-3 text-right">
                  <Money amount={slice.amount} size="sm" />
                  <p className="text-[11px] text-muted-foreground">
                    {slice.share}% tổng {typeLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  )
}
