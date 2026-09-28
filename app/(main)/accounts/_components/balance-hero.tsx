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
      }
    })
    .sort((left, right) => right.chartBalance - left.chartBalance)

  return (
    <Card className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
      <CardContent className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-0">
        <div className="min-w-0 lg:pr-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <WalletCardsIcon className="size-4 shrink-0" aria-hidden="true" />
            <span>Tổng số dư khả dụng</span>
          </div>
          <p className="mt-2 break-words text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
            {formatCurrency(summary.totalBalance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Cập nhật {summary.updatedAt}</p>

          <div className="relative isolate mx-auto mt-4 w-44 sm:w-48">
            {accountsTotal > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="aspect-square w-full"
                initialDimension={{ width: 192, height: 192 }}
              >
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    cursor={false}
                    wrapperStyle={{ zIndex: 20 }}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, item) => (
                          <div className="flex max-w-[min(18rem,75vw)] flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.payload.fill }} />
                            <span className="min-w-0 break-words text-muted-foreground">{name}</span>
                            <span className="tabular-nums">{formatCurrency(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={distribution}
                    dataKey="chartBalance"
                    nameKey="name"
                    innerRadius="72%"
                    outerRadius="95%"
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="aspect-square rounded-full border-[1.5rem] border-muted" />
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold tabular-nums">{reportableAccounts.length}</span>
              <span className="text-xs text-muted-foreground">tài khoản</span>
            </div>
          </div>
          {accountsTotal === 0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">Chưa có số dư dương để hiển thị biểu đồ.</p>
          )}
        </div>

        <div className="min-w-0 border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <div className="mb-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <h2 className="text-sm font-semibold text-foreground">Tài khoản đang hoạt động</h2>
            <span className="shrink-0">Số dư</span>
          </div>
          {distribution.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {distribution.map((account) => (
                <li key={account.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                  <div className="flex min-w-0 flex-1 basis-28 items-center gap-2.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: account.fill }} aria-hidden="true" />
                    <span className="min-w-0 break-words text-sm">{account.name}</span>
                  </div>
                  <span className="ml-auto max-w-full break-words text-right text-sm font-bold tabular-nums">
                    {formatCurrency(account.balance)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">Chưa có tài khoản đang hoạt động.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
