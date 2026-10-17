"use client"

import * as React from "react"

import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { limitJudges } from "@/lib/budgets/months"
import type { BudgetMonth, BudgetMonthGroup, BudgetMonthLine, BudgetOverview } from "@/lib/budgets/types"
import { categoryColorOptions, getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import { formatCompactCurrency } from "@/lib/format-currency"
import { formatShortDate, formatTime, toDateKey } from "@/lib/format-date"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

import { BudgetDailyChart, BudgetMonthsChart, BudgetSplit, KeptMonths } from "./budget-charts"
import { BudgetResult, BudgetTotal } from "./budget-total"

/** A month's line as BudgetTotal reads it: the running month's figure and pace. */
export function overviewOf(month: BudgetMonth, line: BudgetMonthLine): BudgetOverview {
  return {
    month: month.month,
    day: month.gone,
    daysInMonth: month.days,
    total: { budgetId: line.budgetId, limit: line.limit, spent: line.spent, average: 0, fromJars: line.fromJars, adjust: null },
    groups: [],
    alerts: { enabled: true, level: 80 },
    kept: { history: line.history, since: line.since, minMonth: month.minMonth },
  }
}

/** Under a limit's figure: what was paid from savings jars, which it leaves out though the other pages count it. */
export function JarsNote({ amount, className }: { amount: number; className?: string }) {
  if (amount <= 0) return null
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Không tính {formatCompactCurrency(amount, 1)} mua bằng hũ tiết kiệm
    </p>
  )
}

/**
 * The lead card of a month's limit: the running month's figure and pace, or
 * how a month gone by ended (a month before the limit was set only says what
 * was spent); what was paid from jars; then the months before.
 */
export function BudgetHead({ month, line }: { month: BudgetMonth; line: BudgetMonthLine & { limit: number } }) {
  const label = `Tháng ${Number(month.month.slice(5))} đã chi`
  return (
    <>
      {!month.past ? (
        <BudgetTotal overview={overviewOf(month, line)} />
      ) : limitJudges(line.since, month.month) ? (
        <BudgetResult spent={line.spent} limit={line.limit} label={label} />
      ) : (
        <BudgetResult spent={line.spent} label={label} />
      )}
      <JarsNote amount={line.fromJars} className="mt-1.5" />
      <KeptMonths
        history={line.history}
        limit={line.limit}
        month={month.month}
        minMonth={month.minMonth}
        since={line.since}
        className="mt-4 border-t border-separator pt-3.5 empty:hidden"
      />
    </>
  )
}

/** Slice colours for a group's categories: the group's own first, then the palette in order (grey last). */
function itemFills(colorName: CategoryColorName, count: number) {
  const names = categoryColorOptions.map((option) => option.name).filter((name) => name !== "slate")
  const start = Math.max(names.indexOf(colorName as (typeof names)[number]), 0)
  return Array.from({ length: count }, (_, index) => getCategoryColor(names[(start + index) % names.length]).chartFill)
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SettingsGroup plain title={title}>
      <Card size="lg">
        <CardContent>{children}</CardContent>
      </Card>
    </SettingsGroup>
  )
}

/** "Hôm nay, 12:30" or "04/10, 19:56": a row's day and time in a list without day captions. */
function whenLabel(occurredAt: string, today: string) {
  const day = toDateKey(occurredAt)
  return `${day === today ? "Hôm nay" : formatShortDate(day)}, ${formatTime(occurredAt)}`
}

/** The month's latest spendings in the group under one caption, each with its day and time, then a row to all of them. */
function LatestSpending({
  group,
  month,
  today,
  onShowAll,
}: {
  group: BudgetMonthGroup
  month: BudgetMonth
  today: string
  onShowAll: () => void
}) {
  if (group.recent.length === 0) return null
  return (
    <SettingsGroup title={month.past ? `Giao dịch tháng ${Number(month.month.slice(5))}` : "Giao dịch tháng này"}>
      {group.recent.map((entry) => (
        <SettingsRow
          key={entry.id}
          media={<IconTile icon={categoryIconRegistry[entry.iconName]} tone={group.colorName} size="sm" />}
          title={entry.itemName}
          description={entry.accountName}
          action={
            <span className="flex flex-col items-end">
              <Money amount={-entry.amount} size="sm" />
              <span className="text-xs text-muted-foreground">{whenLabel(entry.occurredAt, today)}</span>
            </span>
          }
        />
      ))}
      <SettingsRow title={`Xem tất cả ${group.count} giao dịch`} onClick={onShowAll} />
    </SettingsGroup>
  )
}

/**
 * A group's limit over a month (2026-10-17): the lead card (BudgetHead),
 * spending by day against the plan, by category, the months before, and the
 * latest spendings with a way to all of them.
 */
export function BudgetGroupDetail({
  month,
  group,
  today,
  hint,
  onShowTransactions,
}: {
  month: BudgetMonth
  group: BudgetMonthGroup & { limit: number }
  today: string
  /** Under the lead card: the hint to change the limit (BudgetAdjustHint), this month only. */
  hint?: React.ReactNode
  /** To the transactions page for the month, filtered to these groups. */
  /** The month's spending in some groups or one category, on a screen of the sheet. */
  onShowTransactions: (filter: { title: string; groupIds?: string[]; itemId?: string }) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card size="lg">
        <CardContent>
          <BudgetHead month={month} line={group} />
        </CardContent>
      </Card>
      {hint}
      <ChartCard title="Chi theo ngày">
        <BudgetDailyChart
          daily={group.daily}
          limit={limitJudges(group.since, month.month) ? group.limit : null}
          month={month.month}
          gone={month.gone}
          past={month.past}
        />
      </ChartCard>
      {group.spent > 0 ? (
        <ChartCard title="Theo hạng mục">
          <BudgetSplit
            total={group.spent}
            parts={group.items.map((item, index) => ({
              key: item.itemId,
              name: item.name,
              amount: item.amount,
              fill: itemFills(group.colorName, group.items.length)[index],
              onClick: () => onShowTransactions({ title: item.name, itemId: item.itemId }),
            }))}
          />
        </ChartCard>
      ) : null}
      <ChartCard title="So với các tháng trước">
        <BudgetMonthsChart
          history={group.history}
          limit={group.limit}
          month={month.month}
          minMonth={month.minMonth}
          since={group.since}
          past={month.past}
        />
      </ChartCard>
      <LatestSpending group={group} month={month} today={today} onShowAll={() => onShowTransactions({ title: `Giao dịch ${group.name}`, groupIds: [group.groupId] })} />
    </div>
  )
}

/**
 * The whole month's limit over a month: as a group's, split by group
 * instead (a tap opens that group's, if it has a limit), the groups without
 * a limit together in one row.
 */
export function BudgetTotalDetail({
  month,
  hint,
  onGroup,
  onShowTransactions,
}: {
  month: BudgetMonth
  /** Under the lead card: the hint to change the limit, this month only. */
  hint?: React.ReactNode
  onGroup: (groupId: string) => void
  /** The month's spending in some groups or one category, on a screen of the sheet. */
  onShowTransactions: (filter: { title: string; groupIds?: string[]; itemId?: string }) => void
}) {
  const total = month.total as BudgetMonthLine & { limit: number }
  const limited = month.groups.filter((group) => group.limit !== null && group.spent > 0).sort((a, b) => b.spent - a.spent)
  const unlimited = month.groups.filter((group) => group.limit === null)
  // Spending in groups no longer in use counts in the month too; it joins the groups without a limit.
  const elsewhere = total.spent - limited.reduce((sum, group) => sum + group.spent, 0)
  return (
    <div className="flex flex-col gap-6">
      <Card size="lg">
        <CardContent>
          <BudgetHead month={month} line={total} />
        </CardContent>
      </Card>
      {hint}
      <ChartCard title="Chi theo ngày">
        <BudgetDailyChart
          daily={total.daily}
          limit={limitJudges(total.since, month.month) ? total.limit : null}
          month={month.month}
          gone={month.gone}
          past={month.past}
        />
      </ChartCard>
      {total.spent > 0 ? (
        <ChartCard title="Theo nhóm">
          <BudgetSplit
            total={total.spent}
            parts={[
              ...limited.map((group) => ({
                key: group.groupId,
                name: group.name,
                amount: group.spent,
                fill: getCategoryColor(group.colorName).chartFill,
                over:
                  limitJudges(group.since, month.month) && group.spent > group.limit!
                    ? `Vượt hạn mức nhóm ${formatCompactCurrency(group.spent - group.limit!, 1)}`
                    : undefined,
                onClick: () => onGroup(group.groupId),
              })),
              ...(elsewhere > 0
                ? [
                    {
                      key: "unlimited",
                      name: "Nhóm chưa đặt hạn mức",
                      amount: elsewhere,
                      fill: "var(--chart-neutral)",
                      onClick: () =>
                        onShowTransactions({ title: "Nhóm chưa đặt hạn mức", groupIds: unlimited.map((group) => group.groupId) }),
                    },
                  ]
                : []),
            ]}
          />
        </ChartCard>
      ) : null}
      <ChartCard title="So với các tháng trước">
        <BudgetMonthsChart
          history={total.history}
          limit={total.limit}
          month={month.month}
          minMonth={month.minMonth}
          since={total.since}
          past={month.past}
        />
      </ChartCard>
    </div>
  )
}

/** A detail screen while its month loads: the cards at their size. */
export function BudgetDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Card size="lg">
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>
      <Card size="lg">
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
