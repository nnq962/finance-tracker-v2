"use client"

import * as React from "react"

import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Transaction } from "@/lib/transactions/types"

import { AllocationDonut } from "./allocation-donut"
import { CashFlowCalendar } from "./cash-flow-calendar"

type OverviewMonthProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transactions: Transaction[]
  today: string
  minMonth: string
  /** Shown above the allocation, e.g. debts coming due. */
  aside?: React.ReactNode
  /** Shown below the allocation, e.g. the six-month chart. */
  footer?: React.ReactNode
}

/** The calendar and the allocation chart, which follow the same month. */
export function OverviewMonth({
  accounts,
  categoryGroups,
  transactions,
  today,
  minMonth,
  aside,
  footer,
}: OverviewMonthProps) {
  const [month, setMonth] = React.useState(today.slice(0, 7))

  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <CashFlowCalendar
        accounts={accounts}
        categoryGroups={categoryGroups}
        transactions={transactions}
        today={today}
        minMonth={minMonth}
        month={month}
        onMonthChange={setMonth}
      />
      <div className="min-w-0 space-y-6">
        {aside}
        <AllocationDonut
          categoryGroups={categoryGroups}
          transactions={transactions}
          month={month}
        />
        {footer}
      </div>
    </div>
  )
}
