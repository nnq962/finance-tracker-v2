import {
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
  ReceiptTextIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import {
  getTransactionHeroStats,
  type TransactionTrend,
} from "../_lib/get-transaction-hero-stats"
import { cashFlowColors } from "../_lib/transaction-presentation"
import type {
  Transaction,
  TransactionPeriod,
} from "../_types/transaction"

type TransactionsHeroProps = {
  categoryGroups: CategoryGroup[]
  period: TransactionPeriod
  previousTransactions: Transaction[]
  transactions: Transaction[]
}

type CashFlowCardProps = {
  amount: number
  count: number
  kind: "income" | "expense"
  period: TransactionPeriod
  trend: TransactionTrend
}

const cashFlowContent = {
  income: {
    label: "Đã thu",
  },
  expense: {
    label: "Đã chi",
  },
} as const

function CashFlowTrend({
  kind,
  period,
  trend,
}: Pick<CashFlowCardProps, "kind" | "period" | "trend">) {
  const isFavorable =
    trend.direction === "flat" ||
    (kind === "income" && trend.direction === "up") ||
    (kind === "expense" && trend.direction === "down")
  const TrendIcon =
    trend.direction === "up"
      ? ArrowUpIcon
      : trend.direction === "down"
        ? ArrowDownIcon
        : MinusIcon
  const periodLabel = period === "week" ? "tuần" : "tháng"

  return (
    <p className="flex items-center gap-1 text-sm text-muted-foreground">
      {trend.percentage === null ? (
        <span>Chưa có {periodLabel} trước</span>
      ) : (
        <>
          <span
            className={
              isFavorable
                ? `flex items-center ${cashFlowColors.income.text}`
                : `flex items-center ${cashFlowColors.expense.text}`
            }
          >
            <TrendIcon className="size-4" aria-hidden="true" />
            {trend.percentage}%
          </span>
          <span>so với {periodLabel} trước</span>
        </>
      )}
    </p>
  )
}

function CashFlowCard({
  amount,
  count,
  kind,
  period,
  trend,
}: CashFlowCardProps) {
  const content = cashFlowContent[kind]
  const colors = cashFlowColors[kind]

  return (
    <Card className="h-44">
      <CardHeader>
        <CardTitle>
          <Badge variant={kind === "income" ? "default" : "destructive"}>
            {content.label}
          </Badge>
        </CardTitle>
        <CardAction>
          <CashFlowTrend kind={kind} period={period} trend={trend} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <p
            className={`text-[2rem] font-semibold tracking-tight tabular-nums ${colors.text}`}
          >
            {formatCurrency(amount)}
          </p>
          <Separator className="data-horizontal:h-0! border-t-2 border-dashed border-[#e7e4dd] bg-transparent dark:border-[#35323e]" />
          <p className="text-xs text-muted-foreground">{count} giao dịch</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function TransactionsHero({
  categoryGroups,
  period,
  previousTransactions,
  transactions,
}: TransactionsHeroProps) {
  const stats = getTransactionHeroStats(
    transactions,
    previousTransactions,
    categoryGroups,
  )
  const topExpense = stats.topExpenseCategory
  const TopExpenseIcon = topExpense?.group
    ? categoryIconRegistry[topExpense.group.iconName]
    : ReceiptTextIcon
  const topExpenseColor = topExpense?.group
    ? getCategoryColor(topExpense.group.colorName)
    : null
  const periodLabel = period === "week" ? "tuần đang xem" : "tháng đang xem"

  return (
    <section
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      aria-label="Tổng quan giao dịch"
    >
      <CashFlowCard
        amount={stats.income}
        count={stats.incomeCount}
        kind="income"
        period={period}
        trend={stats.incomeTrend}
      />
      <CashFlowCard
        amount={stats.expense}
        count={stats.expenseCount}
        kind="expense"
        period={period}
        trend={stats.expenseTrend}
      />
      <Card className="h-44 md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Chi nhiều nhất {periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1">
          {topExpense ? (
            <div className="w-full space-y-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${topExpenseColor?.surfaceClassName ?? "bg-muted text-muted-foreground"}`}
                >
                  <TopExpenseIcon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{topExpense.name}</p>
                  <p className={`font-medium ${cashFlowColors.expense.text}`}>
                    {formatCurrency(topExpense.amount)}
                  </p>
                </div>
                <p className="text-2xl font-semibold tabular-nums">
                  {topExpense.percentage}%
                </p>
              </div>
              <Progress
                tone="coral"
                value={topExpense.percentage}
                aria-label={`${topExpense.name} chiếm ${topExpense.percentage}% tổng chi`}
              />
              <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                <p>{topExpense.count} giao dịch</p>
                <p className="text-right">
                  Trung bình{" "}
                  {formatCurrency(topExpense.amount / topExpense.count)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              Chưa có khoản chi trong {periodLabel}.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
