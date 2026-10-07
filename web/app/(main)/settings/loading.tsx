import { Card } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"

/** Same footprint as a SettingsGroup caption. */
function CaptionSkeleton() {
  return (
    <div className="flex min-h-6 items-center px-3">
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Same footprint as SettingsGroup with `rows` SettingsRow items. */
function GroupSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      <CaptionSkeleton />
      <Card size="sm" className="gap-0 py-0">
        <div className="px-1">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex items-center gap-3.5 px-4 py-3.5">
              <Skeleton className="size-8 shrink-0" />
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
        className="grid items-start gap-6 md:grid-cols-2 md:gap-8"
      >
        <GroupSkeleton rows={2} />
        <GroupSkeleton rows={2} />
        <GroupSkeleton rows={2} />
        <GroupSkeleton rows={1} />
        <GroupSkeleton rows={1} />
        <GroupSkeleton rows={1} />
      </div>

      <span className="sr-only">Đang tải dữ liệu cài đặt...</span>
    </Page>
  )
}
