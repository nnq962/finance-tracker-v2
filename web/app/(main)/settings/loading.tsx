import { Card } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

/** Same footprint as a SettingsGroup caption. */
function CaptionSkeleton() {
  return (
    <div className="flex min-h-6 items-center px-3">
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Same footprint as SettingsGroup with `rows` SettingsRow items. */
function GroupSkeleton({ rows, title = true }: { rows: number; title?: boolean }) {
  return (
    <div className="space-y-2">
      {title ? <CaptionSkeleton /> : null}
      <Card size="sm" className="gap-0 py-0">
        <div className="px-1">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className={cn("flex items-center gap-2.5 px-3 py-3.5 not-first:pt-4", settingsSeparatorClassName(true))}>
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
        className="grid items-start gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-8 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]"
      >
        <div className="min-w-0 space-y-6">
          <GroupSkeleton rows={2} />
          <GroupSkeleton rows={2} />
          <GroupSkeleton rows={2} />
          <GroupSkeleton rows={1} />
          <GroupSkeleton rows={1} />
        </div>

        <div className="hidden max-w-2xl min-w-0 md:block">
          <GroupSkeleton rows={3} />
        </div>
      </div>

      <span className="sr-only">Đang tải dữ liệu cài đặt...</span>
    </Page>
  )
}
