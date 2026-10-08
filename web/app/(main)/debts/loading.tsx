import { FloatingActionsSkeleton } from "@/components/app/floating-actions"
import { FlowTilesSkeleton } from "@/components/app/flow-tiles"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Same footprint as the side panel's start: the person as its caption, the
 * card of what is left (label, total, bar, what is paid), then the figures
 * and dates as rows of a title and a value.
 */
function DetailSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center px-3">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-2">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="flex h-[42.5px] items-center">
              <Skeleton className="h-8 w-48 max-w-full" />
            </div>
            <Skeleton className="h-2 rounded-full" />
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-40 max-w-full" />
            </div>
          </CardContent>
        </Card>
        <SettingsGroupSkeleton caption={false} rows={3} media="none" trailing="value" />
        <SettingsGroupSkeleton caption={false} rows={2} media="none" trailing="value" />
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
        <PageHeaderSkeleton title="Vay nợ" accessory={1} actions={["w-40", "w-44"]} />

        {/* The same columns as DebtsView. */}
        <div className="grid items-start gap-6 md:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0 space-y-6 md:space-y-8">
            <FlowTilesSkeleton />
            {/* "Cần thu" and "Cần trả": each person's avatar, name and note,
                what is left and when it is due, and the chevron. */}
            {[0, 1].map((index) => (
              <SettingsGroupSkeleton key={index} rows={2} media="avatar" description trailing="amount" chevron />
            ))}
          </div>
          <div className="hidden xl:block">
            <DetailSkeleton />
          </div>
        </div>
        <FloatingActionsSkeleton />
      </div>

      <span className="sr-only">Đang tải danh bạ và các khoản vay nợ...</span>
    </Page>
  )
}
