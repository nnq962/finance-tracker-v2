import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { Page } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { OverviewGreetingSkeleton } from "./_components/overview-greeting"
import { OverviewLayout } from "./_components/overview-layout"

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

function CalendarSkeleton() {
  return (
    <Card size="lg">
      <CardHeader>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-36" />
        <CardAction className="flex gap-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </CardAction>
      </CardHeader>
      <CardContent className="@container space-y-5">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, index) => (
            <div key={index} className="flex min-h-14 flex-col items-center gap-1 pt-1 @lg:min-h-20 @lg:pt-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-2.5 w-8" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 border-t pt-5">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  )
}

/** A title and a chart, as for the allocation and the six-month chart. */
function ChartSkeleton({ className }: { className: string }) {
  return (
    <Card size="lg">
      <CardContent className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className={cn("w-full", className)} />
      </CardContent>
    </Card>
  )
}

export default function OverviewLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải tổng quan"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-4 md:space-y-6">
        <OverviewGreetingSkeleton />
        <OverviewLayout
          netWorth={<NetWorthSkeleton />}
          calendar={<CalendarSkeleton />}
          allocation={<ChartSkeleton className="h-72" />}
          trend={<ChartSkeleton className="h-44 sm:h-56" />}
        />
      </div>

      <span className="sr-only">Đang tải tổng quan tài chính...</span>
    </Page>
  )
}
