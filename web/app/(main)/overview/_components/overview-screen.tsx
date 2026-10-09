"use client"

import * as React from "react"

import { Section } from "@/components/app/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { OverviewSummary } from "@/lib/overview/summary"
import type { DayTotals, MonthAllocation } from "@/lib/overview/month-data"

import { CategoryBreakdown } from "./category-breakdown"
import { MonthSection } from "./month-section"
import { CashFlowChart } from "./overview-charts"
import { OverviewLayout } from "./overview-layout"
import { DueDebts, NetWorth } from "./overview-sections"

/** Income against expenses for each of the last six months, titled outside its card. */
function TrendSection({ cashFlow }: { cashFlow: OverviewSummary["cashFlow"] }) {
  return (
    <Section
      title="Thu và chi theo tháng"
      action={
        cashFlow.hasActivity ? (
          <span aria-hidden="true" className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-income" />
              Thu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-chart-neutral" />
              Chi
            </span>
          </span>
        ) : undefined
      }
    >
      <Card size="lg">
        <CardContent>
          {cashFlow.hasActivity ? (
            <CashFlowChart data={cashFlow} />
          ) : (
            <Empty className="p-4">
              <EmptyHeader>
                <EmptyDescription>Chưa có thu chi</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </Section>
  )
}

/**
 * The overview's body below the greeting: net worth, the new user's missions,
 * the chosen month (figures, calendar, categories), six months of income and
 * expenses, then debts coming due. The month is shared by the calendar and
 * the categories.
 */
export function OverviewScreen({
  accounts,
  categoryGroups,
  days,
  allocation,
  today,
  minMonth,
  summary,
  missions,
}: {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  days: Record<string, DayTotals>
  allocation: Record<string, MonthAllocation>
  today: string
  minMonth: string
  summary: OverviewSummary
  missions?: React.ReactNode
}) {
  const [month, setMonth] = React.useState(today.slice(0, 7))
  // The calendar takes the new month at once; the categories' ring follows
  // once it has, so a tap on the arrows answers straight away.
  const categoriesMonth = React.useDeferredValue(month)
  // Each block is made again only when its own data changes, so a new month
  // redraws the calendar first and the categories after, never the rest.
  const { netWorth: netWorthData, cashFlow, dueDebts: dueDebtsData } = summary
  const { current: thisMonth } = cashFlow
  const netWorth = React.useMemo(
    () => <NetWorth data={netWorthData} month={thisMonth} />,
    [netWorthData, thisMonth],
  )
  const dueDebts = React.useMemo(
    () => (dueDebtsData.length > 0 ? <DueDebts debts={dueDebtsData} /> : undefined),
    [dueDebtsData],
  )
  const trend = React.useMemo(() => <TrendSection cashFlow={cashFlow} />, [cashFlow])
  const categories = React.useMemo(
    () => <CategoryBreakdown categoryGroups={categoryGroups} allocation={allocation} month={categoriesMonth} />,
    [categoryGroups, allocation, categoriesMonth],
  )

  return (
    <OverviewLayout
      netWorth={netWorth}
      missions={missions}
      calendar={
        <MonthSection
          accounts={accounts}
          categoryGroups={categoryGroups}
          days={days}
          today={today}
          minMonth={minMonth}
          month={month}
          onMonthChange={setMonth}
        />
      }
      dueDebts={dueDebts}
      allocation={categories}
      trend={trend}
    />
  )
}
