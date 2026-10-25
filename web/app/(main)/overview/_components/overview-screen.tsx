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
import { useHiddenBalance } from "./hide-balance"
import { DueDebts, NetWorth } from "./overview-sections"
import { RecentTransactions } from "./recent-transactions"
import { SavingsJars } from "./savings-jars"
import { VersusLastMonth } from "./versus-last-month"
import type { Transaction } from "../../transactions/_types/transaction"

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
  recent,
  initialHidden,
  missions,
  budgets,
}: {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  days: Record<string, DayTotals>
  allocation: Record<string, MonthAllocation>
  today: string
  minMonth: string
  summary: OverviewSummary
  /** The last few transactions, newest first. */
  recent: Transaction[]
  /** Whether the figures were hidden last time (the cookie), so the page comes already hidden. */
  initialHidden: boolean
  missions?: React.ReactNode
  /** This month's spending limits, under net worth; renders nothing while none is set. */
  budgets?: React.ReactNode
}) {
  const [month, setMonth] = React.useState(today.slice(0, 7))
  // The calendar takes the new month at once; the categories' ring follows
  // once it has, so a tap on the arrows answers straight away.
  const categoriesMonth = React.useDeferredValue(month)
  // Each block is made again only when its own data changes, so a new month
  // redraws the calendar first and the categories after, never the rest.
  const { netWorth: netWorthData, cashFlow, dueDebts: dueDebtsData } = summary
  const [hidden, toggleHidden] = useHiddenBalance(initialHidden)
  const netWorth = React.useMemo(
    () => <NetWorth data={netWorthData} months={cashFlow.months} hidden={hidden} onToggleHidden={toggleHidden} />,
    [netWorthData, cashFlow.months, hidden, toggleHidden],
  )
  const versus = React.useMemo(() => <VersusLastMonth days={days} today={today} hidden={hidden} />, [days, today, hidden])
  const recentSection = React.useMemo(
    () => <RecentTransactions transactions={recent} accounts={accounts} categoryGroups={categoryGroups} today={today} />,
    [recent, accounts, categoryGroups, today],
  )
  const jars = React.useMemo(() => <SavingsJars accounts={accounts} today={today} />, [accounts, today])
  const dueDebts = React.useMemo(
    () => (dueDebtsData.length > 0 ? <DueDebts debts={dueDebtsData} /> : undefined),
    [dueDebtsData],
  )
  const trend = React.useMemo(() => <TrendSection cashFlow={cashFlow} />, [cashFlow])
  const categories = React.useMemo(
    () => <CategoryBreakdown categoryGroups={categoryGroups} allocation={allocation} month={categoriesMonth} today={today} />,
    [categoryGroups, allocation, categoriesMonth, today],
  )

  return (
    <OverviewLayout
      netWorth={netWorth}
      versus={versus}
      recent={recentSection}
      jars={jars}
      missions={missions}
      budgets={budgets}
      calendar={
        // The header's date pill scrolls here.
        <div id="overview-month" className="scroll-mt-4">
          <MonthSection
            accounts={accounts}
            categoryGroups={categoryGroups}
            days={days}
            today={today}
            minMonth={minMonth}
            month={month}
            onMonthChange={setMonth}
          />
        </div>
      }
      dueDebts={dueDebts}
      dueDebtsUrgent={dueDebtsData.some((debt) => debt.daysUntilDue <= 3)}
      allocation={categories}
      trend={trend}
    />
  )
}
