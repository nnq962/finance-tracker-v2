import { Card, CardContent } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

import { TransactionsLayout } from "./_components/transactions-layout"

/** Same footprint as the month's pill and its two tiles, money in and money out. */
function MonthSummarySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-9 w-40 rounded-full max-lg:hidden" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
        {[0, 1].map((index) => (
          <Card key={index} size="sm" className="px-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-28 max-w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/** Same footprint as the desktop filter panel: a caption, then rows of chips. */
function FilterPanelSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center px-3">
        <Skeleton className="h-3 w-16" />
      </div>
      <Card>
        <CardContent className="space-y-6">
          {[3, 2, 4].map((chips, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: chips }, (_, chip) => (
                  <Skeleton key={chip} className="h-7 w-20" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/** Same footprint as a day's SettingsGroup of transaction rows. */
function DayGroupSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between px-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Card size="sm" className="gap-0 py-0">
        <div className="px-1">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className={cn("flex items-center gap-2.5 px-3 py-3.5 not-first:pt-4", settingsSeparatorClassName(true))}>
              <Skeleton className="size-8 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32 max-w-full" />
                <Skeleton className="h-3.5 w-40 max-w-full" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3.5 w-10" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function TransactionsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải giao dịch"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-6 md:space-y-8">
        <div className="max-lg:hidden">
          <PageHeaderSkeleton action />
        </div>
        {/* Below lg: the month. */}
        <div className="flex h-11 items-center lg:hidden">
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        <TransactionsLayout
          summary={<MonthSummarySkeleton />}
          filters={<FilterPanelSkeleton />}
        >
          <div className="flex gap-2">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="size-11 rounded-full lg:hidden" />
          </div>
          <div className="space-y-6 md:space-y-8">
            <DayGroupSkeleton rows={3} />
            <DayGroupSkeleton rows={2} />
          </div>
        </TransactionsLayout>
      </div>

      <span className="sr-only">Đang tải dữ liệu giao dịch...</span>
    </Page>
  )
}
