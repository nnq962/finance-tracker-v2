import { Card, CardContent } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"

/** Same footprint as SettingsGroup with `rows` SettingsRow items. */
function GroupSkeleton({ rows, title = true }: { rows: number; title?: boolean }) {
  return (
    <div className="space-y-2">
      {title ? <Skeleton className="mx-3 h-3 w-16" /> : null}
      <Card size="sm" className="gap-0 py-0">
        <div className="divide-y-2 divide-[#e7e4dd] px-1 dark:divide-[#35323e]">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex items-center gap-2.5 px-3 py-3.5">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-4 w-14" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải cài đặt"
      aria-busy="true"
    >
      <PageHeaderSkeleton />

      <div
        aria-hidden="true"
        className="grid items-start gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-8"
      >
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-5 w-36 max-w-full" />
                <Skeleton className="h-4 w-52 max-w-full" />
              </div>
            </CardContent>
          </Card>
          <GroupSkeleton rows={3} />
          <GroupSkeleton rows={1} />
          <GroupSkeleton rows={1} title={false} />
        </div>

        <div className="hidden min-w-0 space-y-4 md:block">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <GroupSkeleton rows={3} title={false} />
        </div>
      </div>

      <span className="sr-only">Đang tải dữ liệu cài đặt...</span>
    </Page>
  )
}
