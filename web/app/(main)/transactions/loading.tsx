import { FloatingActionsSkeleton } from "@/components/app/floating-actions"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { TransactionsLayout } from "./_components/transactions-layout"
import { MonthSummarySkeleton } from "./_components/month-summary"

/**
 * The desktop filter panel's fields, in order: the kind's four chips, the
 * amount range's two fields, then the accounts' and the categories' chips,
 * as wide as their usual names.
 */
const filterFieldChips = [
  ["w-16", "w-20", "w-20", "w-28"],
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
        <PageHeaderSkeleton bare lead tools={["round", "round"]} />
        <TransactionsLayout
          summary={<MonthSummarySkeleton />}
          filters={<FilterPanelSkeleton />}
        >
          {/* The round search field from lg up; on phones the kind chips with their counts, as wide as their names. */}
          <div className="flex flex-col gap-3">
            <Skeleton className="h-11 rounded-full max-lg:hidden" />
            <div className="-mx-(--main-content-px) flex items-center gap-2 overflow-hidden px-(--main-content-px) lg:hidden">
              {["w-[5.5rem]", "w-[4.25rem]", "w-[4.75rem]", "w-[8.5rem]"].map((width, index) => (
                <Skeleton key={index} className={cn("h-9 shrink-0 rounded-full", width)} />
              ))}
            </div>
          </div>
          {/* Days: the date's badge, its name and date, and the day's total as the caption, then
              a card of rows with the category's icon, name and account, amount and time. */}
          <div className="space-y-4 md:space-y-6">
            {[3, 2, 2].map((rows, index) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-3 pb-2">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-[34px] rounded-[11px]" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <SettingsGroupSkeleton caption={false} rows={rows} description trailing="amount" />
              </div>
            ))}
          </div>
        </TransactionsLayout>
        <FloatingActionsSkeleton />
      </div>

      <span className="sr-only">Đang tải dữ liệu giao dịch...</span>
    </Page>
  )
}
