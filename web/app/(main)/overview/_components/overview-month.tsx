"use client"

import * as React from "react"

import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { DayTotals, MonthAllocation } from "@/lib/overview/month-data"

import { AllocationDonut } from "./allocation-donut"
import { CashFlowCalendar } from "./cash-flow-calendar"
import { OverviewLayout } from "./overview-layout"

type OverviewMonthProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  days: Record<string, DayTotals>
  allocation: Record<string, MonthAllocation>
  today: string
  minMonth: string
  netWorth: React.ReactNode
  missions?: React.ReactNode
  /** Debts coming due; left out when there are none. */
  dueDebts?: React.ReactNode
  /** The six-month chart. */
  trend: React.ReactNode
}

/**
 * The overview's sections around the calendar and the allocation chart, which
 * follow the same month.
 */
export function OverviewMonth({
  accounts,
  categoryGroups,
  days,
  allocation,
  today,
  minMonth,
  netWorth,
  missions,
  dueDebts,
  trend,
}: OverviewMonthProps) {
  const [month, setMonth] = React.useState(today.slice(0, 7))

  return (
    <OverviewLayout
      netWorth={netWorth}
      missions={missions}
      calendar={
        <CashFlowCalendar
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
      allocation={
        <AllocationDonut
          categoryGroups={categoryGroups}
          allocation={allocation}
          month={month}
        />
      }
      trend={trend}
    />
  )
}
