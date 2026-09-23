"use client"

import { WalletCardsIcon } from "lucide-react"
import { Pie, PieChart } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import type { Account, BalanceSummary } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

type BalanceHeroProps = {
  summary: BalanceSummary
  accounts: Account[]
}

const accountColors = [
  "#2563EB",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
  "#84CC16",
] as const

const chartConfig = {
  balance: {
    label: "Số dư",
  },
} satisfies ChartConfig

export function BalanceHero({ summary, accounts }: BalanceHeroProps) {
  const reportableAccounts = accounts.filter(
    (account) => account.status === "active",
  )
  const accountsTotal = reportableAccounts.reduce(
    (total, account) => total + Math.max(account.balance, 0),
    0,
  )
  const distribution = reportableAccounts
    .map((account, index) => {
      const chartBalance = Math.max(account.balance, 0)

      return {
        ...account,
        chartBalance,
        fill: accountColors[index % accountColors.length],
        percentage:
          accountsTotal > 0 ? (chartBalance / accountsTotal) * 100 : 0,
      }
    })
    .sort((left, right) => right.chartBalance - left.chartBalance)
  const largestAccount = distribution[0]

  return (
    <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(7)] lg:[--card-spacing:--spacing(8)]">
      <CardContent className="space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
            <WalletCardsIcon className="size-4" />
            <span>Tổng số dư khả dụng</span>
          </div>

          <div className="space-y-2">
            <p className="text-3xl font-semibold tracking-[-0.04em] tabular-nums sm:text-4xl xl:text-5xl">
              {formatCurrency(summary.totalBalance)}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>{reportableAccounts.length} tài khoản</span>
              <span className="size-1 rounded-full bg-border" aria-hidden="true" />
              <span>Cập nhật {summary.updatedAt}</span>
            </div>
          </div>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.8fr)] lg:gap-12">
          <div className="relative isolate mx-auto flex w-full max-w-64 items-center justify-center">
            {accountsTotal > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="aspect-square h-auto w-full"
                initialDimension={{ width: 256, height: 256 }}
              >
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    cursor={false}
                    wrapperStyle={{ zIndex: 20 }}
                    content={
                      <ChartTooltipContent
                        className="bg-popover"
                        hideLabel
                        formatter={(value, name, item) => {
                          const percentage =
                            accountsTotal > 0
                              ? (Number(value) / accountsTotal) * 100
                              : 0

                          return (
                            <div className="flex min-w-48 items-center gap-2">
                              <span
                                className="size-2.5 shrink-0 rounded-sm"
                                style={{ backgroundColor: item.payload.fill }}
                              />
                              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                                {name}
                              </span>
                              <span className="font-mono font-medium tabular-nums">
                                {formatCurrency(Number(value))} ·{" "}
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  <Pie
                    data={distribution}
                    dataKey="chartBalance"
                    nameKey="name"
                    innerRadius="67%"
                    outerRadius="94%"
                    paddingAngle={1.5}
                    cornerRadius={4}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="aspect-square w-full rounded-full border-[2.75rem] border-muted" />
            )}

            <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center px-14 text-center">
              {largestAccount && accountsTotal > 0 ? (
                <>
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Lớn nhất
                  </span>
                  <span className="mt-1 max-w-full truncate text-sm font-medium">
                    {largestAccount.name}
                  </span>
                  <span
                    className="mt-1 text-2xl font-semibold tabular-nums"
                    style={{ color: largestAccount.fill }}
                  >
                    {largestAccount.percentage.toFixed(1)}%
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Chưa có số dư
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="hidden grid-cols-[minmax(8rem,0.8fr)_minmax(7rem,1.4fr)_minmax(7rem,auto)_3.5rem] gap-4 text-sm font-medium tracking-wide text-muted-foreground uppercase md:grid">
              <span className="pl-5">Tài khoản</span>
              <span>Tỉ trọng</span>
              <span className="text-right">Số dư</span>
              <span className="text-right">%</span>
            </div>

            {distribution.map((account) => (
              <div
                key={account.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(8rem,0.8fr)_minmax(7rem,1.4fr)_minmax(7rem,auto)_3.5rem]"
              >
                <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: account.fill }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium">
                    {account.name}
                  </span>
                </div>

                <Progress
                  value={Math.min(account.percentage, 100)}
                  aria-label={`${account.name}: ${account.percentage.toFixed(1)}%`}
                  className="col-start-1 row-start-2 md:col-start-2 md:row-start-1"
                />

                <span className="col-start-2 row-start-1 text-right text-sm font-semibold tabular-nums md:col-start-3">
                  {formatCurrency(account.balance)}
                </span>
                <span className="col-start-2 row-start-2 text-right text-sm font-medium tabular-nums text-muted-foreground md:col-start-4 md:row-start-1">
                  {account.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
