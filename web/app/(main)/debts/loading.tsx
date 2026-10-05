import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

/** Same footprint as a caption above a card, with an amount when `total`. */
function CaptionSkeleton({ total = false }: { total?: boolean }) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-3 px-3">
      <Skeleton className="h-3 w-24" />
      {total ? <Skeleton className="h-3 w-20" /> : null}
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="space-y-2">
      <CaptionSkeleton />
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-4 w-28 max-w-full" />
                <Skeleton className="h-6 w-32 max-w-full" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Same footprint as SettingsGroup with `rows` debt rows. */
function GroupSkeleton({ rows, total = true }: { rows: number; total?: boolean }) {
  return (
    <div className="space-y-2">
      <CaptionSkeleton total={total} />
      <Card size="sm" className="gap-0 py-0">
        <div className="px-1">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className={cn("flex items-center gap-2.5 px-3 py-3.5 not-first:pt-4", settingsSeparatorClassName(true))}>
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28 max-w-full" />
                <Skeleton className="h-3.5 w-36 max-w-full" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3.5 w-14" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-2">
      <CaptionSkeleton />
      <div className="space-y-6">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  )
}

export default function DebtsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải vay nợ"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-6 md:space-y-8">
        <PageHeaderSkeleton action />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0 space-y-6">
            <SummarySkeleton />
            <GroupSkeleton rows={2} />
            <GroupSkeleton rows={1} />
            <GroupSkeleton rows={1} total={false} />
          </div>
          <div className="hidden xl:block">
            <DetailSkeleton />
          </div>
        </div>
      </div>

      <span className="sr-only">Đang tải danh bạ và các khoản vay nợ...</span>
    </Page>
  )
}
