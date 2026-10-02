import { Card, CardContent } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

/** Same footprint as a SettingsGroup with `rows` rows. */
function GroupSkeleton({ rows, title = true }: { rows: number; title?: boolean }) {
  return (
    <div className="space-y-2">
      {title ? <Skeleton className="mx-3 h-3 w-28" /> : null}
      <Card size="sm" className="gap-0 py-0">
        <div className="px-1">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className={cn("flex items-center gap-2.5 px-3 py-3.5", settingsSeparatorClassName(true))}>
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, index) => (
            <div key={index} className="flex min-h-14 flex-col items-center gap-1 pt-1">
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
        <PageHeaderSkeleton />
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-56 max-w-full" />
            </CardContent>
          </Card>
          <GroupSkeleton rows={3} title={false} />
        </div>
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <CalendarSkeleton />
          <div className="min-w-0 space-y-6">
            <GroupSkeleton rows={3} />
            <Card>
              <CardContent>
                <Skeleton className="h-48 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <span className="sr-only">Đang tải tổng quan tài chính...</span>
    </Page>
  )
}
