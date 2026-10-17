"use client"

import * as React from "react"
import { LayersIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { LimitRow } from "@/components/app/limit-row"
import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { BudgetMonth, BudgetMonthEntry, BudgetMonthGroup, BudgetMonthLine, BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { formatDayLabel, formatTime, toDateKey } from "@/lib/format-date"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import { BudgetDailyChart, BudgetMonthsChart, KeptMonths } from "./budget-charts"
import { BudgetResult, BudgetTotal } from "./budget-total"

/** A month's line as BudgetTotal reads it: the running month's figure and pace. */
export function overviewOf(month: BudgetMonth, line: BudgetMonthLine): BudgetOverview {
  return {
    month: month.month,
    day: month.gone,
    daysInMonth: month.days,
    total: { budgetId: line.budgetId, limit: line.limit, spent: line.spent, average: 0 },
    groups: [],
  }
}

/** The lead card of a month's limit: the running month's figure and pace, or how a month gone by ended; then the six months before. */
export function BudgetHead({ month, line }: { month: BudgetMonth; line: BudgetMonthLine & { limit: number } }) {
  return (
    <>
      {month.past ? (
        <BudgetResult spent={line.spent} limit={line.limit} label={`Tháng ${Number(month.month.slice(5))} đã chi`} />
      ) : (
        <BudgetTotal overview={overviewOf(month, line)} />
      )}
      <KeptMonths
        history={line.history}
        limit={line.limit}
        month={month.month}
        minMonth={month.minMonth}
        className="mt-4 border-t border-separator pt-3.5 empty:hidden"
      />
    </>
  )
}

type Part = { key: string; media: React.ReactNode; name: string; amount: number; caption: string; onClick: () => void }

/** Where the spending went: each part's amount, its share of the whole and a bar of it, largest first. */
function Parts({ title, spent, parts }: { title: string; spent: number; parts: Part[] }) {
  if (parts.length === 0) return null
  return (
    <SettingsGroup title={title}>
      {parts.map((part) => (
        <LimitRow
          key={part.key}
          media={part.media}
          title={part.name}
          figure={<span className="font-semibold">{formatCompactCurrency(part.amount, 1)}</span>}
          value={part.amount}
          max={spent || 1}
          caption={`${spent ? Math.round((part.amount / spent) * 100) : 0}% · ${part.caption}`}
          onClick={part.onClick}
        />
      ))}
    </SettingsGroup>
  )
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

/** The group's latest spendings by day, then a row to all of them on the transactions page. */
function LatestSpending({ group, today, onShowAll }: { group: BudgetMonthGroup; today: string; onShowAll: () => void }) {
  if (group.recent.length === 0) return null
  const days = new Map<string, BudgetMonthEntry[]>()
  for (const entry of group.recent) {
    const day = toDateKey(entry.occurredAt)
    days.set(day, [...(days.get(day) ?? []), entry])
  }
  const keys = [...days.keys()]
  return (
    <>
      {keys.map((day, index) => (
        <SettingsGroup key={day} title={formatDayLabel(day, today)}>
          {days.get(day)!.map((entry) => (
            <SettingsRow
              key={entry.id}
              media={<IconTile icon={categoryIconRegistry[entry.iconName]} tone={group.colorName} size="sm" />}
              title={entry.itemName}
              description={entry.accountName}
              action={
                <span className="flex flex-col items-end">
                  <Money amount={-entry.amount} size="sm" />
                  <span className="text-xs text-muted-foreground">{formatTime(entry.occurredAt)}</span>
                </span>
              }
            />
          ))}
          {index === keys.length - 1 ? <SettingsRow title={`Xem tất cả ${group.count} giao dịch`} onClick={onShowAll} /> : null}
        </SettingsGroup>
      ))}
    </>
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
  onShowTransactions,
}: {
  month: BudgetMonth
  group: BudgetMonthGroup & { limit: number }
  today: string
  /** To the transactions page for the month, filtered to these groups. */
  onShowTransactions: (groupIds: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card size="lg">
        <CardContent>
          <BudgetHead month={month} line={group} />
        </CardContent>
      </Card>
      <ChartCard title="Chi theo ngày">
        <BudgetDailyChart daily={group.daily} limit={group.limit} month={month.month} gone={month.gone} past={month.past} />
      </ChartCard>
      <Parts
        title="Theo hạng mục"
        spent={group.spent}
        parts={group.items.map((item) => ({
          key: item.itemId,
          media: <IconTile icon={categoryIconRegistry[item.iconName]} tone={group.colorName} size="sm" />,
          name: item.name,
          amount: item.amount,
          caption: `${item.count} giao dịch`,
          onClick: () => onShowTransactions([group.groupId]),
        }))}
      />
      <ChartCard title="So với các tháng trước">
        <BudgetMonthsChart history={group.history} limit={group.limit} month={month.month} minMonth={month.minMonth} past={month.past} />
      </ChartCard>
      <LatestSpending group={group} today={today} onShowAll={() => onShowTransactions([group.groupId])} />
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
  onGroup,
  onShowTransactions,
}: {
  month: BudgetMonth
  onGroup: (groupId: string) => void
  onShowTransactions: (groupIds: string[]) => void
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
      <ChartCard title="Chi theo ngày">
        <BudgetDailyChart daily={total.daily} limit={total.limit} month={month.month} gone={month.gone} past={month.past} />
      </ChartCard>
      <Parts
        title="Theo nhóm"
        spent={total.spent}
        parts={[
          ...limited.map((group) => ({
            key: group.groupId,
            media: <IconTile icon={categoryIconRegistry[group.iconName]} tone={group.colorName} size="sm" />,
            name: group.name,
            amount: group.spent,
            caption:
              group.spent > group.limit! ? `vượt hạn mức nhóm ${formatCompactCurrency(group.spent - group.limit!, 1)}` : "tổng chi",
            onClick: () => onGroup(group.groupId),
          })),
          ...(elsewhere > 0
            ? [
                {
                  key: "unlimited",
                  media: <IconTile icon={LayersIcon} tone="neutral" size="sm" />,
                  name: "Chưa đặt hạn mức",
                  amount: elsewhere,
                  caption: unlimited.filter((group) => group.spent > 0).map((group) => group.name).join(", ") || "nhóm đã ngừng dùng",
                  onClick: () => onShowTransactions(unlimited.map((group) => group.groupId)),
                },
              ]
            : []),
        ]}
      />
      <ChartCard title="So với các tháng trước">
        <BudgetMonthsChart history={total.history} limit={total.limit} month={month.month} minMonth={month.minMonth} past={month.past} />
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
