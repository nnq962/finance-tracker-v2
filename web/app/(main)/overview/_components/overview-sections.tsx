import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowDownLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarClockIcon,
  CircleDollarSignIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import type { OverviewSummary } from "@/lib/overview/summary"
import { cn } from "@/lib/utils"

import { transactionPresentation } from "../../transactions/_lib/transaction-presentation"
import { CashFlowChart } from "./overview-charts"

const transactionDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh",
})

const MAX_SPENDING_GROUPS = 5

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={href} prefetch={false} aria-label={label}>
        Xem
        <ArrowRightIcon />
      </Link>
    </Button>
  )
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">{children}</CardContent>
    </Card>
  )
}

function CompactEmpty({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <Empty className="flex-1 py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}

const netWorthParts = [
  {
    key: "cash",
    label: "Số dư tài khoản",
    href: "/budget",
    icon: WalletCardsIcon,
    iconClassName: "bg-[#d6f4ff] text-[#0083c4] dark:bg-[#113950] dark:text-[#78d0ff]",
  },
  {
    key: "receivable",
    label: "Người khác nợ tôi",
    href: "/debts",
    icon: ArrowDownLeftIcon,
    iconClassName: "bg-[#dbf9d2] text-[#3e9727] dark:bg-[#203e1a] dark:text-[#94e379]",
  },
  {
    key: "payable",
    label: "Tôi đang nợ",
    href: "/debts",
    icon: ArrowUpRightIcon,
    iconClassName: "bg-[#ffe5e1] text-[#c8393a] dark:bg-[#542523] dark:text-[#ff9b93]",
  },
] as const

export function NetWorth({ data }: { data: OverviewSummary["netWorth"] }) {
  const values = { cash: data.cash, receivable: data.receivable, payable: -data.payable }

  return (
    <Card
      asChild
      className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]"
    >
      <section aria-labelledby="net-worth-title">
        <CardContent className="space-y-5">
          <div>
            <h2 id="net-worth-title" className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <CircleDollarSignIcon className="size-4 shrink-0" aria-hidden="true" />
              Tài sản ròng
            </h2>
            <p
              className={cn(
                "mt-2 font-heading text-4xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere] sm:text-5xl",
                data.total < 0 && "text-[#c8393a] dark:text-[#ff9b93]",
              )}
            >
              {formatCurrency(data.total)}
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3">
            {netWorthParts.map((part) => {
              const Icon = part.icon
              const value = values[part.key]

              return (
                <li key={part.key} className="min-w-0">
                  <Card pressable asChild size="sm" className="h-full flex-row items-center gap-3 px-(--card-spacing) sm:flex-col sm:items-start">
                    <Link href={part.href} prefetch={false}>
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${part.iconClassName}`}>
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-muted-foreground sm:flex-none">
                        {part.label}
                      </span>
                      <span className="shrink-0 font-heading text-base font-extrabold tabular-nums sm:text-lg">
                        {formatCurrency(value, { signDisplay: part.key === "cash" ? "auto" : value === 0 ? "auto" : "always" })}
                      </span>
                    </Link>
                  </Card>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </section>
    </Card>
  )
}

export function CashFlow({ summary }: { summary: OverviewSummary }) {
  const { current } = summary.cashFlow
  const net = current.income - current.expense
  const stats = [
    { label: "Thu", value: current.income, dotClassName: "bg-[#3e9727]", signDisplay: "auto" as const },
    { label: "Chi", value: current.expense, dotClassName: "bg-[#ff837e] dark:bg-[#f2564f]", signDisplay: "auto" as const },
    { label: "Chênh lệch", value: net, dotClassName: null, signDisplay: net === 0 ? "auto" as const : "always" as const },
  ]

  return (
    <SectionCard
      title="Thu chi"
      action={<Badge variant="secondary">{summary.monthLabel}</Badge>}
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "min-w-0",
              // On phones the difference gets its own row so no amount wraps.
              index === 2 && "col-span-2 flex items-baseline justify-between gap-3 border-t-2 border-[#e7e4dd] pt-3 sm:col-span-1 sm:block sm:border-0 sm:pt-0 dark:border-[#35323e]",
            )}
          >
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {stat.dotClassName ? (
                <span className={`size-2 shrink-0 rounded-full ${stat.dotClassName}`} aria-hidden="true" />
              ) : null}
              {stat.label}
            </dt>
            <dd className="mt-1 font-heading text-base font-extrabold tabular-nums [overflow-wrap:anywhere] sm:text-lg">
              {formatCurrency(stat.value, { signDisplay: stat.signDisplay })}
            </dd>
          </div>
        ))}
      </dl>
      {summary.cashFlow.hasActivity ? (
        <div className="mt-5">
          <CashFlowChart data={summary.cashFlow} />
        </div>
      ) : (
        <CompactEmpty icon={<ReceiptTextIcon />} title="Chưa có thu chi" />
      )}
    </SectionCard>
  )
}

export function Spending({
  categoryGroups,
  summary,
}: {
  categoryGroups: CategoryGroup[]
  summary: OverviewSummary
}) {
  const total = summary.cashFlow.current.expense
  const groupsById = new Map(categoryGroups.map((group) => [group.id, group]))
  const topGroups = summary.spending.slice(0, MAX_SPENDING_GROUPS)

  return (
    <SectionCard
      title="Chi theo nhóm"
      action={<SectionLink href="/transactions" label="Xem giao dịch" />}
    >
      {topGroups.length ? (
        <ul className="space-y-4">
          {topGroups.map((item) => {
            const group = groupsById.get(item.id)
            const Icon = group ? categoryIconRegistry[group.iconName] : ReceiptTextIcon
            const color = group ? getCategoryColor(group.colorName) : null
            const share = total > 0 ? Math.round((item.amount / total) * 100) : 0

            return (
              <li key={item.id} className="flex min-w-0 items-center gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color?.surfaceClassName ?? "bg-muted text-muted-foreground"}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-bold">{item.name}</span>
                    <span className="shrink-0 font-bold tabular-nums">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress tone="coral" value={share} aria-label={`${item.name} chiếm ${share}% tổng chi`} />
                    <span className="w-[4ch] shrink-0 text-right text-xs tabular-nums text-muted-foreground">{share}%</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <CompactEmpty icon={<ReceiptTextIcon />} title="Chưa có chi tiêu tháng này" />
      )}
    </SectionCard>
  )
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words

  return letters.map((word) => word[0]).join("").toUpperCase() || "?"
}

function getDueBadge(daysUntilDue: number) {
  if (daysUntilDue < 0) return { label: `Quá ${Math.abs(daysUntilDue)} ngày`, variant: "solid" as const }
  if (daysUntilDue === 0) return { label: "Hôm nay", variant: "solid" as const }
  if (daysUntilDue <= 7) return { label: `Còn ${daysUntilDue} ngày`, variant: "sun" as const }
  return { label: `Còn ${daysUntilDue} ngày`, variant: "outline" as const }
}

export function DueDebts({ debts }: { debts: OverviewSummary["dueDebts"] }) {
  return (
    <SectionCard title="Sắp đến hạn" action={<SectionLink href="/debts" label="Xem nợ và cho vay" />}>
      {debts.length ? (
        <ul className="-mx-2 space-y-1">
          {debts.map((debt) => {
            const badge = getDueBadge(debt.daysUntilDue)

            return (
              <li key={debt.id}>
                <Link
                  href={`/debts?debt=${encodeURIComponent(debt.id)}`}
                  prefetch={false}
                  className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#f3f1ec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:bg-[#2a2831]"
                >
                  <Avatar>
                    <AvatarFallback>{getInitials(debt.contactName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{debt.contactName}</p>
                    <p className="text-xs text-muted-foreground">
                      {debt.direction === "lent" ? "Cho vay" : "Đi vay"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(debt.remainingAmount)}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <CompactEmpty icon={<CalendarClockIcon />} title="Không có khoản sắp đến hạn" />
      )}
    </SectionCard>
  )
}

export function RecentTransactions({ transactions }: { transactions: OverviewSummary["recentTransactions"] }) {
  return (
    <SectionCard title="Giao dịch gần đây" action={<SectionLink href="/transactions" label="Xem tất cả giao dịch" />}>
      {transactions.length ? (
        <ul className="space-y-3">
          {transactions.map((transaction) => {
            const presentation = transactionPresentation[transaction.kind]
            const Icon = presentation.icon

            return (
              <li key={transaction.id} className="flex min-w-0 items-center gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${presentation.iconClassName}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{transaction.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {transactionDateFormatter.format(new Date(transaction.occurredAt))}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-bold tabular-nums ${transaction.kind === "transfer" ? "" : presentation.amountClassName}`}>
                  {formatCurrency(
                    transaction.kind === "expense" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
                    { signDisplay: transaction.kind === "transfer" ? "never" : "always" },
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <CompactEmpty icon={<ReceiptTextIcon />} title="Chưa có giao dịch" />
      )}
    </SectionCard>
  )
}
