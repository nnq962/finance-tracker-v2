import { Card, CardContent } from "@/components/ui/card"
import { Page } from "@/components/page"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { OverviewGreetingSkeleton } from "./_components/overview-greeting"
import { OverviewLayout } from "./_components/overview-layout"

/** The total and its three tiles. */
function NetWorthSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="mx-3 h-3 w-24" />
      <Card>
        <CardContent className="space-y-4">
          <Skeleton className="h-11 w-56 max-w-full" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[5.375rem] rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="mx-3 h-3 w-24" />
      <Card>
        <CardContent className="@container space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="mx-1 h-5 w-32" />
            <div className="flex gap-1">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, index) => (
              <div key={index} className="flex min-h-14 flex-col items-center gap-1 pt-1 @lg:min-h-20 @lg:pt-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-2.5 w-8" />
              </div>
            ))}
          </div>
          <Separator variant="chunky" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** A caption and a card, as for the allocation and the six-month chart. */
function ChartSkeleton({ className }: { className: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className="mx-3 h-3 w-28" />
      <Card>
        <CardContent>
          <Skeleton className={cn("w-full rounded-lg", className)} />
        </CardContent>
      </Card>
    </div>
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
        <OverviewGreetingSkeleton />
        <OverviewLayout
          netWorth={<NetWorthSkeleton />}
          calendar={<CalendarSkeleton />}
          allocation={<ChartSkeleton className="h-72" />}
          trend={<ChartSkeleton className="h-48 sm:h-56" />}
        />
      </div>

      <span className="sr-only">Đang tải tổng quan tài chính...</span>
    </Page>
  )
}
