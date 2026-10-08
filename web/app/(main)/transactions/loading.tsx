import { FloatingActionsSkeleton } from "@/components/app/floating-actions"
import { FlowTilesSkeleton } from "@/components/app/flow-tiles"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { TransactionsLayout } from "./_components/transactions-layout"

/**
 * The desktop filter panel's fields, in order: the kind's five chips, the
 * amount range's two fields, then the accounts' and the categories' chips,
 * as wide as their usual names.
 */
const filterFieldChips = [
  ["w-16", "w-20", "w-20", "w-28", "w-16"],
  null,
  ["w-28", "w-20", "w-24"],
  ["w-20", "w-20", "w-16", "w-20"],
  ["w-16", "w-24", "w-16", "w-20"],
]

/** Same footprint as the desktop filter panel: its caption, then each field's label over its chips or fields. */
function FilterPanelSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center px-3">
        <Skeleton className="h-3 w-16" />
      </div>
      <Card>
        <CardContent className="space-y-6">
          {filterFieldChips.map((chips, index) => (
            <div key={index} className="space-y-3">
              <div className="flex h-5 items-center">
                <Skeleton className="h-3.5 w-24" />
              </div>
              {chips ? (
                <div className="flex flex-wrap gap-2">
                  {chips.map((width, chip) => (
                    <Skeleton key={chip} className={cn("h-9 rounded-full", width)} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-11 rounded-xl" />
                  <Skeleton className="h-11 rounded-xl" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
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
        <PageHeaderSkeleton title="Giao dịch" tools={["pill"]} accessory={1} actions={["w-52", "w-44"]} />
        <TransactionsLayout
          summary={<FlowTilesSkeleton />}
          filters={<FilterPanelSkeleton />}
        >
          {/* The round search field, and on phones the filter button. */}
          <div className="flex gap-2">
            <Skeleton className="h-11 flex-1 rounded-full" />
            <Skeleton className="size-11 rounded-full lg:hidden" />
          </div>
          {/* Days: the date and the day's totals as the caption, then rows
              with the category's icon, name and account, amount and time. */}
          <div className="space-y-6 md:space-y-8">
            {[3, 2, 2].map((rows, index) => (
              <SettingsGroupSkeleton key={index} rows={rows} captionAction description trailing="amount" />
            ))}
          </div>
        </TransactionsLayout>
        <FloatingActionsSkeleton />
      </div>

      <span className="sr-only">Đang tải dữ liệu giao dịch...</span>
    </Page>
  )
}
