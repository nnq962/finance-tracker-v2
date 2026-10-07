import type * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Page } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"

import { OverviewLayout } from "./_components/overview-layout"

/** The avatar, the greeting and the bell. */
function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 pt-1">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-36" />
      </div>
      <Skeleton className="size-11 shrink-0 rounded-full" />
    </div>
  )
}

/** The label, the total and its three parts. */
function NetWorthSkeleton() {
  return (
    <Card size="lg">
      <CardContent>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-9 w-56 max-w-full" />
        <Skeleton className="mt-2 h-4 w-36" />
        <div className="mt-5 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10" />
          ))}
        </div>
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

function CalendarSkeleton() {
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
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, index) => (
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

/** The switch, then the ring with its list beside it. */
function CategoriesSkeleton() {
  return (
    <SectionSkeleton>
      <Skeleton className="h-11 rounded-full" />
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

function TrendSkeleton() {
  return (
    <SectionSkeleton>
      <Card size="lg">
        <CardContent>
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
        <HeaderSkeleton />
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
