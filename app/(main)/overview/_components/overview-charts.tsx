"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"

const cashFlowConfig = {
  income: { label: "Thu", theme: { light: "#0d9488", dark: "#2dd4bf" } },
  expense: { label: "Chi", theme: { light: "#e11d48", dark: "#fb7185" } },
} satisfies ChartConfig

const spendingConfig = {
  amount: { label: "Đã chi", theme: { light: "#2563eb", dark: "#60a5fa" } },
} satisfies ChartConfig

function compactMoney(value: number) {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}tr`
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(0))}k`
  return String(value)
}

export function CashFlowChart({ data }: { data: OverviewSummary["cashFlow"] }) {
  if (!data.hasActivity) {
    return (
      <Empty className="min-h-64">
        <EmptyHeader>
          <EmptyTitle>Chưa có giao dịch thu chi</EmptyTitle>
          <EmptyDescription>Biểu đồ sẽ xuất hiện khi bạn ghi nhận thu nhập hoặc chi tiêu.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const peak = Math.max(...data.months.flatMap((month) => [month.income, month.expense]))
  const axisUnit = peak >= 1_000_000 ? 1_000_000 : peak >= 1_000 ? 1_000 : 1
  const axisLabel = axisUnit === 1_000_000 ? "triệu đồng" : axisUnit === 1_000 ? "nghìn đồng" : "đồng"

  return (
    <>
      <ChartContainer config={cashFlowConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data.months} accessibilityLayer barGap={4} margin={{ top: 8, right: 8, left: 16, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis tickFormatter={(value: number) => String(Number((value / axisUnit).toFixed(1)))} tickLine={false} axisLine={false} width={64} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex min-w-40 justify-between gap-4">
                    <span>{name === "income" ? "Thu" : "Chi"}</span>
                    <strong className="font-medium tabular-nums">{formatCurrency(Number(value))}</strong>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">Trục dọc: {axisLabel}</p>
      <ul className="sr-only">
        {data.months.map((month) => (
          <li key={month.key}>{month.label}: thu {formatCurrency(month.income)}, chi {formatCurrency(month.expense)}</li>
        ))}
      </ul>
    </>
  )
}

export function SpendingChart({ data }: { data: OverviewSummary["spending"] }) {
  if (data.length === 0) {
    return (
      <Empty className="min-h-64">
        <EmptyHeader>
          <EmptyTitle>Chưa có chi tiêu tháng này</EmptyTitle>
          <EmptyDescription>Các nhóm chi tiêu sẽ được tổng hợp ở đây.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const topGroups = data.slice(0, 5)

  return (
    <>
      <ChartContainer config={spendingConfig} className="aspect-auto h-64 w-full">
        <BarChart data={topGroups} layout="vertical" accessibilityLayer margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickFormatter={compactMoney} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tickFormatter={(name: string) => name.length > 15 ? `${name.slice(0, 14)}…` : name}
            tickLine={false}
            axisLine={false}
            width={112}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => (
              <div className="flex min-w-48 justify-between gap-4">
                <span className="truncate">{item.payload.name}</span>
                <strong className="font-medium tabular-nums">{formatCurrency(Number(value))}</strong>
              </div>
            )} />}
          />
          <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ChartContainer>
      <ul className="sr-only">
        {topGroups.map((group) => <li key={group.id}>{group.name}: {formatCurrency(group.amount)}</li>)}
      </ul>
    </>
  )
}
