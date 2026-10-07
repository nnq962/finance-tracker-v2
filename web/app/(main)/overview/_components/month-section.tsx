"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Section } from "@/components/app/section-header"
import { Button } from "@/components/ui/button"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { DayTotals } from "@/lib/overview/month-data"

import { CashFlowCalendar, shiftMonth } from "./cash-flow-calendar"

/**
 * The month block: its title with arrows to the months before, and the
 * calendar of days.
 */
export function MonthSection({
  accounts,
  categoryGroups,
  days,
  today,
  minMonth,
  month,
  onMonthChange,
}: {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  days: Record<string, DayTotals>
  today: string
  minMonth: string
  month: string
  onMonthChange: (month: string) => void
}) {
  const [year, monthNumber] = month.split("-").map(Number)
  const previousMonth = shiftMonth(month, -1)

  return (
    <Section
      title={`Tháng ${monthNumber}${year !== Number(today.slice(0, 4)) ? `, ${year}` : ""}`}
      action={
        <span className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Tháng trước"
            disabled={month <= minMonth}
            onClick={() => onMonthChange(previousMonth)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Tháng sau"
            disabled={month >= today.slice(0, 7)}
            onClick={() => onMonthChange(shiftMonth(month, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </span>
      }
    >
      <CashFlowCalendar
        accounts={accounts}
        categoryGroups={categoryGroups}
        days={days}
        today={today}
        month={month}
      />
    </Section>
  )
}
