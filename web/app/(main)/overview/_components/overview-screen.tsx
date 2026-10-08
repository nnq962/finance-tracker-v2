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
              <span className="size-2 rounded-full bg-expense" />
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
 * then the chosen month (figures, calendar, categories), debts coming due, six
 * months of income and expenses, and the Pro invitation. The month is shared
 * by the calendar and the categories.
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
  planInvite,
}: {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  days: Record<string, DayTotals>
  allocation: Record<string, MonthAllocation>
  today: string
  minMonth: string
  summary: OverviewSummary
  missions?: React.ReactNode
  planInvite?: React.ReactNode
}) {
  const [month, setMonth] = React.useState(today.slice(0, 7))

  return (
    <OverviewLayout
      netWorth={<NetWorth data={summary.netWorth} month={summary.cashFlow.current} />}
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
      dueDebts={summary.dueDebts.length > 0 ? <DueDebts debts={summary.dueDebts} /> : undefined}
      allocation={<CategoryBreakdown categoryGroups={categoryGroups} allocation={allocation} month={month} />}
      trend={<TrendSection cashFlow={summary.cashFlow} />}
      planInvite={planInvite}
    />
  )
}
