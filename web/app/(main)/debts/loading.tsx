import { Card } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

/** Same footprint as a caption above a card. */
function CaptionSkeleton() {
  return (
    <div className="flex min-h-6 items-center px-3">
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

/** Same footprint as the two FlowTiles: Cần thu and Cần trả. */
function TilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((index) => (
        <Card key={index} size="sm" className="px-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-[10px]" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-28 max-w-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </Card>
      ))}
    </div>
  )
}

/** Same footprint as SettingsGroup with `rows` debt rows. */
function GroupSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      <CaptionSkeleton />
      <Card size="sm" className="gap-0 py-0">
        <div className="px-1">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className={cn("flex items-center gap-2.5 px-3 py-3.5 not-first:pt-4", settingsSeparatorClassName(true))}>
              <Skeleton className="size-9 shrink-0 rounded-full" />
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
        <div className="max-md:hidden">
          <PageHeaderSkeleton action />
        </div>
        <div className="flex justify-end md:hidden">
          <Skeleton className="size-11 rounded-full" />
        </div>

        <div className="grid items-start gap-6 md:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0 space-y-6 md:space-y-8">
            <TilesSkeleton />
            <GroupSkeleton rows={2} />
            <GroupSkeleton rows={2} />
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
