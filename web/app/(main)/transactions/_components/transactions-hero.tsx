import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  MinusIcon,
  ReceiptTextIcon,
} from "lucide-react"

import { SplitProgress } from "@/components/split-progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import {
  getTransactionHeroStats,
  type ExpenseCategoryStat,
  type TransactionTrend,
} from "../_lib/get-transaction-hero-stats"
import {
  cashFlowColors,
  transactionPresentation,
} from "../_lib/transaction-presentation"
import type {
  Transaction,
  TransactionPeriod,
} from "../_types/transaction"

type TransactionsHeroProps = {
  categoryGroups: CategoryGroup[]
  period: TransactionPeriod
  previousTransactions: Transaction[]
  rangeLabel: string
  transactions: Transaction[]
}

type CashFlowKind = "income" | "expense"

const cashFlowLabels = {
  income: "Đã thu",
  expense: "Đã chi",
} as const

function getPeriodLabel(period: TransactionPeriod) {
  return period === "week" ? "tuần" : "tháng"
}

function TrendBadge({
  kind,
  period,
  trend,
}: {
  kind: CashFlowKind
  period: TransactionPeriod
  trend: TransactionTrend
}) {
  const periodLabel = getPeriodLabel(period)

  if (trend.percentage === null) {
    return (
      <Badge variant="outline" title={`Chưa có dữ liệu ${periodLabel} trước`}>
        Mới
      </Badge>
    )
  }

  const isFlat = trend.direction === "flat"
  const isFavorable =
    (kind === "income" && trend.direction === "up") ||
    (kind === "expense" && trend.direction === "down")
  const TrendIcon = isFlat
    ? MinusIcon
    : trend.direction === "up"
      ? ArrowUpIcon
      : ArrowDownIcon
  const description = isFlat
    ? `Không đổi so với ${periodLabel} trước`
    : `${trend.direction === "up" ? "Tăng" : "Giảm"} ${trend.percentage}% so với ${periodLabel} trước`

  return (
    <Badge
      variant={isFlat ? "outline" : isFavorable ? "default" : "destructive"}
      title={description}
    >
      <TrendIcon aria-hidden="true" />
      {trend.percentage}%
      <span className="sr-only">{description}</span>
    </Badge>
  )
}

function CashFlowStat({
  amount,
  count,
  kind,
  period,
  trend,
}: {
  amount: number
  count: number
  kind: CashFlowKind
  period: TransactionPeriod
  trend: TransactionTrend
}) {
  const presentation = transactionPresentation[kind]
  const Icon = presentation.icon

  return (
    <div className="min-w-0 rounded-xl border-2 border-[#e7e4dd] p-3 sm:p-4 dark:border-[#35323e]">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${cashFlowColors[kind].surface}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <TrendBadge kind={kind} period={period} trend={trend} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {cashFlowLabels[kind]}
      </p>
      <p
        className={`font-heading text-lg leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere] sm:text-xl ${cashFlowColors[kind].text}`}
      >
        {formatCurrency(amount)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{count} giao dịch</p>
    </div>
  )
}

function CashFlowRatio({ income, expense }: { income: number; expense: number }) {
  const total = income + expense

  if (total === 0) {
    return <Progress value={0} aria-label="Chưa có khoản thu hoặc chi" />
  }

  const incomeShare = Math.round((income / total) * 100)
  const expenseShare = 100 - incomeShare

  return (
    <div className="space-y-2">
      <SplitProgress
        aria-label={`Thu chiếm ${incomeShare}%, chi chiếm ${expenseShare}% tổng dòng tiền`}
        segments={[
          { value: income, tone: "leaf" },
          { value: expense, tone: "coral" },
        ]}
      />
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${cashFlowColors.income.dot}`} aria-hidden="true" />
          Thu {incomeShare}%
        </span>
        <span className="flex items-center gap-1.5">
          Chi {expenseShare}%
          <span className={`size-2 rounded-full ${cashFlowColors.expense.dot}`} aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

const MAX_VISIBLE_CATEGORIES = 5

function ExpenseCategories({
  categories,
  period,
}: {
  categories: ExpenseCategoryStat[]
  period: TransactionPeriod
}) {
  const periodLabel = getPeriodLabel(period)

  if (categories.length === 0) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ReceiptTextIcon className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">
          Chưa có khoản chi trong {periodLabel} này.
        </p>
      </div>
    )
  }

  const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES)

  return (
    <div className="min-w-0">
      <h2 className="text-sm font-bold text-muted-foreground">
        Chi nhiều nhất {periodLabel} này
      </h2>
      <ul className="mt-4 space-y-3">
        {visibleCategories.map((category) => {
          const Icon = category.group
            ? categoryIconRegistry[category.group.iconName]
            : ReceiptTextIcon
          const color = category.group
            ? getCategoryColor(category.group.colorName)
            : null

          return (
            <li
              key={category.group?.id ?? category.name}
              className="flex min-w-0 items-center gap-3 text-sm"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color?.surfaceClassName ?? "bg-muted text-muted-foreground"}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{category.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {category.count} giao dịch
                </span>
              </span>
              <span className="shrink-0 font-bold tabular-nums">
                {formatCurrency(category.amount)}
              </span>
              <span className="w-[4ch] shrink-0 text-right tabular-nums text-muted-foreground">
                {category.percentage}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function TransactionsHero({
  categoryGroups,
  period,
  previousTransactions,
  rangeLabel,
  transactions,
}: TransactionsHeroProps) {
  const stats = getTransactionHeroStats(
    transactions,
    previousTransactions,
    categoryGroups,
  )
  const net = stats.income - stats.expense
  const netClassName =
    net > 0
      ? cashFlowColors.income.text
      : net < 0
        ? cashFlowColors.expense.text
        : "text-foreground"

  return (
    <Card
      asChild
      className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]"
    >
      <section aria-label="Tổng quan giao dịch">
      <CardContent className="@container/transactions-hero min-w-0">
        <div className="grid min-w-0 gap-6 @min-[52rem]/transactions-hero:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1fr)] @min-[52rem]/transactions-hero:gap-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDaysIcon className="size-4 shrink-0" aria-hidden="true" />
                Dòng tiền · {rangeLabel}
              </p>
              <Badge variant="secondary">{transactions.length} giao dịch</Badge>
            </div>

            <p
              className={`mt-3 font-heading text-3xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere] @min-[28rem]/transactions-hero:text-4xl ${netClassName}`}
            >
              {formatCurrency(net, { signDisplay: "always" })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chênh lệch thu – chi trong {getPeriodLabel(period)}
            </p>

            <div className="mt-5">
              <CashFlowRatio income={stats.income} expense={stats.expense} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <CashFlowStat
                amount={stats.income}
                count={stats.incomeCount}
                kind="income"
                period={period}
                trend={stats.incomeTrend}
              />
              <CashFlowStat
                amount={stats.expense}
                count={stats.expenseCount}
                kind="expense"
                period={period}
                trend={stats.expenseTrend}
              />
            </div>
          </div>

          <Separator
            orientation="vertical"
            variant="chunky"
            className="hidden @min-[52rem]/transactions-hero:block"
          />
          <Separator
            variant="chunky"
            className="@min-[52rem]/transactions-hero:hidden"
          />

          <ExpenseCategories categories={stats.expenseCategories} period={period} />
        </div>
      </CardContent>
      </section>
    </Card>
  )
}
