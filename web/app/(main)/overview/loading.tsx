import type * as React from "react"

import { Stat, StatGroup } from "@/components/app/stat-group"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toDateKey } from "@/lib/format-date"

import { OverviewLayout } from "./_components/overview-layout"

/**
 * Same footprint as NetWorth on the dark lead card: the label's 20px line,
 * the total's 42.5px one (34px at leading-tight), the month's change, then
 * the three parts under a line.
 */
function NetWorthSkeleton() {
  return (
    <Card size="lg" variant="inverse">
      <CardContent>
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="mt-1.5 flex h-[42.5px] items-center">
          <Skeleton className="h-8 w-56 max-w-full" />
        </div>
        <div className="mt-0.5 flex h-5 items-center">
          <Skeleton className="h-3.5 w-32" />
        </div>
        <StatGroup separated className="mt-5">
          {[0, 1, 2].map((index) => (
            <Stat
              key={index}
              value={<Skeleton className="h-3.5 w-12" />}
              label={<Skeleton className="mt-1.5 h-3 w-14 max-w-full" />}
            />
          ))}
        </StatGroup>
      </CardContent>
    </Card>
  )
}

/** Same footprint as Section: the title's 44px row, then the content 8px below. */
function SectionSkeleton({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex min-h-11 items-center justify-between gap-3 px-1">
        <Skeleton className="h-6 w-32" />
        {action}
      </div>
      <div className="mt-2 space-y-3">{children}</div>
    </div>
  )
}

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

/**
 * The calendar opens on this month (in Vietnam time), so its weeks are known
 * before the data: the same leading blanks and days as CashFlowCalendar, so
 * a month of four or six weeks does not move what is below when it arrives.
 */
function CalendarSkeleton() {
  const [year, month] = toDateKey(new Date()).split("-").map(Number)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  // Monday-first: getUTCDay() is 0 for Sunday.
  const leadingBlanks = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7

  return (
    <SectionSkeleton
      action={
        <div className="flex gap-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      }
    >
      <Card size="lg">
        <CardContent className="@container">
          {/* The weekdays are known, so they show as in CashFlowCalendar. */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((weekday) => (
              <span key={weekday} className="pb-1 text-[11px] text-muted-foreground">
                {weekday}
              </span>
            ))}
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => (
              <div key={index} className="flex min-h-14 flex-col items-center gap-1 pt-1 @lg:min-h-20 @lg:pt-2">
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-2.5 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SectionSkeleton>
  )
}

/** The switch (TabsList, 52 high), then the ring with its list beside it. */
function CategoriesSkeleton() {
  return (
    <SectionSkeleton>
      <Skeleton className="h-[52px] rounded-full" />
      <Card size="lg">
        <CardContent className="flex items-center gap-6">
          <Skeleton className="size-32 shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    </SectionSkeleton>
  )
}

/** The chosen month's readout (its name, then its two figures, on 20px lines) over the chart. */
function TrendSkeleton() {
  return (
    <SectionSkeleton>
      <Card size="lg">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-48 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-44 w-full sm:h-56" />
        </CardContent>
      </Card>
    </SectionSkeleton>
  )
}

export default function OverviewLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải tổng quan"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-6 md:space-y-8">
        <PageHeaderSkeleton lead tools={["round"]} />
        <OverviewLayout
          netWorth={<NetWorthSkeleton />}
          calendar={<CalendarSkeleton />}
          allocation={<CategoriesSkeleton />}
          trend={<TrendSkeleton />}
        />
      </div>

      <span className="sr-only">Đang tải tổng quan tài chính...</span>
    </Page>
  )
}
