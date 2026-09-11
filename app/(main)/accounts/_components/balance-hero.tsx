"use client"

import {
  ArrowUpRightIcon,
  Clock3Icon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"
import { Area, AreaChart, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/format-currency"

import type { BalanceSummary } from "../_types/account"
import type { Account } from "../_types/account"

type BalanceHeroProps = {
  summary: BalanceSummary
  accounts: Account[]
}

const accountColors = [
  { bar: "bg-blue-500", dot: "bg-blue-500" },
  { bar: "bg-emerald-500", dot: "bg-emerald-500" },
  { bar: "bg-amber-500", dot: "bg-amber-500" },
] as const

const chartConfig = {
  balance: {
    label: "Số dư",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function BalanceHero({ summary, accounts }: BalanceHeroProps) {
  const change = summary.changePercent.toLocaleString("vi-VN", {
    signDisplay: "always",
  })
  const latestBalance = summary.trend.at(-1)?.balance ?? summary.totalBalance
  const previousBalance = summary.trend.at(-2)?.balance ?? latestBalance
  const changeAmount = latestBalance - previousBalance
  const accountsTotal = accounts.reduce(
    (total, account) => total + Math.max(account.balance, 0),
    0,
  )
  const distribution = accounts.map((account, index) => ({
    ...account,
    percentage:
      accountsTotal > 0 ? (Math.max(account.balance, 0) / accountsTotal) * 100 : 0,
    color: accountColors[index % accountColors.length],
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" size="icon-lg">
            <span aria-hidden="true">
              <WalletCardsIcon />
            </span>
          </Button>
          <div>
            <CardTitle>Tổng số dư</CardTitle>
            <CardDescription>Tài sản khả dụng</CardDescription>
          </div>
        </div>
        <CardAction>
          <Badge variant="secondary">
            <TrendingUpIcon data-icon="inline-start" />
            {change}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl lg:text-5xl">
                {formatCurrency(summary.totalBalance)}
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <ArrowUpRightIcon className="size-4" />
                <span>
                  {formatCurrency(changeAmount, { signDisplay: "always" })} tháng này
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex h-2 gap-1">
                {distribution.map((account) => (
                  <div
                    key={account.id}
                    className={`min-w-2 rounded-full ${account.color.bar}`}
                    style={{ flexGrow: Math.max(account.balance, 0) }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {distribution.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`size-2 rounded-full ${account.color.dot}`}
                    />
                    <span className="text-muted-foreground">
                      {account.name}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {Math.round(account.percentage)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ChartContainer config={chartConfig} className="h-40 w-full">
            <AreaChart
              accessibilityLayer
              data={summary.trend}
              margin={{ top: 12, right: 12, bottom: 0, left: 12 }}
            >
              <defs>
                <linearGradient id="balance-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-balance)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-balance)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                hide
                domain={["dataMin - 3000000", "dataMax + 3000000"]}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                  />
                }
              />
              <Area
                dataKey="balance"
                type="monotone"
                fill="url(#balance-gradient)"
                stroke="var(--color-balance)"
                strokeWidth={2.5}
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <WalletCardsIcon className="size-4" />
            {summary.accountCount} tài khoản
          </span>
          <span className="flex items-center gap-2">
            <Clock3Icon className="size-4" />
            {summary.updatedAt}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
