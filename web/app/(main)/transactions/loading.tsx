import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

function TransactionsHeroSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <Separator variant="chunky" />
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-6 w-28 max-w-full" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          ))}
        </div>
        <Separator variant="chunky" />
        <div className="flex justify-between gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
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
            <div key={row} className={cn("flex items-center gap-2.5 px-3 py-3.5", settingsSeparatorClassName(true))}>
              <Skeleton className="size-8 shrink-0 rounded-lg" />
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
        <PageHeaderSkeleton action />
        <TransactionsHeroSkeleton />
        <div className="flex gap-2">
          <Skeleton className="h-8 max-w-md flex-1 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className="space-y-6">
          <DayGroupSkeleton rows={3} />
          <DayGroupSkeleton rows={2} />
        </div>
      </div>

      <span className="sr-only">Đang tải dữ liệu giao dịch...</span>
    </Page>
  )
}
