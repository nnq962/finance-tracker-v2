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
import type { Account, BalanceSummary } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

type BalanceHeroProps = {
  summary: BalanceSummary
  accounts: Account[]
}

const accountColors = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#06B6D4",
  "#8B5CF6",
  "#EF4444",
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
    (account) => account.status === "active" && !account.excludeFromReports,
  )
  const accountsTotal = reportableAccounts.reduce(
    (total, account) => total + Math.max(account.balance, 0),
    0,
  )
  const distribution = reportableAccounts.map((account, index) => {
    const chartBalance = Math.max(account.balance, 0)

    return {
      ...account,
      chartBalance,
      fill: accountColors[index % accountColors.length],
      percentage: accountsTotal > 0 ? (chartBalance / accountsTotal) * 100 : 0,
    }
  })
  const largestAccount =
    distribution.length > 0
      ? distribution.reduce((largest, account) =>
          account.chartBalance > largest.chartBalance ? account : largest,
        )
      : null

  return (
    <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(7)] lg:[--card-spacing:--spacing(8)]">
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
          <WalletCardsIcon className="size-4" />
          <span>Tổng số dư khả dụng</span>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-12 xl:gap-16">
          <div className="min-w-0 space-y-8">
            <div className="space-y-2">
              <p className="text-4xl font-semibold tracking-[-0.04em] tabular-nums sm:text-5xl xl:text-6xl">
                {formatCurrency(summary.totalBalance)}
              </p>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground sm:text-base">
                <span>{reportableAccounts.length} tài khoản</span>
                <span className="size-1 rounded-full bg-border" aria-hidden="true" />
                <span>Cập nhật {summary.updatedAt}</span>
              </div>
            </div>

            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {distribution.map((account) => (
                <div key={account.id} className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: account.fill }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm text-muted-foreground">
                    {account.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {Math.round(account.percentage)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[300px] items-center justify-center">
            {accountsTotal > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="aspect-square h-auto w-full"
                initialDimension={{ width: 300, height: 300 }}
              >
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, item) => (
                          <div className="flex min-w-44 items-center gap-2">
                            <span
                              className="size-2.5 shrink-0 rounded-sm"
                              style={{ backgroundColor: item.payload.fill }}
                            />
                            <span className="min-w-0 flex-1 truncate text-muted-foreground">
                              {name}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatCurrency(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={distribution}
                    dataKey="chartBalance"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="94%"
                    paddingAngle={0}
                    stroke="var(--card)"
                    strokeWidth={3}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="aspect-square w-full rounded-full border-[2.75rem] border-muted" />
            )}

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-16 text-center">
              {largestAccount && accountsTotal > 0 ? (
                <>
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Cao nhất
                  </span>
                  <span className="max-w-full truncate text-base font-semibold">
                    {largestAccount.name}
                  </span>
                  <span
                    className="text-3xl font-semibold tabular-nums"
                    style={{ color: largestAccount.fill }}
                  >
                    {Math.round(largestAccount.percentage)}%
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Chưa có số dư
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
