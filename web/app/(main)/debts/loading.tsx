import { FloatingActionsSkeleton } from "@/components/app/floating-actions"
import { FlowTilesSkeleton } from "@/components/app/flow-tiles"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Skeleton } from "@/components/ui/skeleton"

import { DebtDetailSkeleton } from "./_components/debt-detail-panel"

/** The side panel's caption and its details, as DebtDetailPanel lays them out. */
function DetailSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center px-3">
        <Skeleton className="h-3 w-28" />
      </div>
      <DebtDetailSkeleton />
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
