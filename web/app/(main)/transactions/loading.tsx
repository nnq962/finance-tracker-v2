import { Card, CardContent } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"

import { TransactionsLayout } from "./_components/transactions-layout"

function TransactionsHeroSkeleton() {
  return (
    <div className="space-y-2">
      <div className="hidden min-h-4 items-center px-3 lg:flex">
        <Skeleton className="h-3 w-28" />
      </div>
      <Card className="max-lg:contents">
        <CardContent className="space-y-5 max-lg:px-0">
          <Skeleton className="h-10 rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-48 max-w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[4.75rem] rounded-2xl" />
            <Skeleton className="h-[4.75rem] rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Same footprint as the desktop filter panel: a caption, then rows of chips. */
function FilterPanelSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center px-3">
        <Skeleton className="h-3 w-16" />
      </div>
      <Card>
        <CardContent className="space-y-6">
          {[3, 2, 4].map((chips, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: chips }, (_, chip) => (
                  <Skeleton key={chip} className="h-7 w-20 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/** Same footprint as a day: its sticky header, then rows edge to edge. */
function DayGroupSkeleton({ rows }: { rows: number }) {
  return (
    <div>
      <div className="mx-[calc(var(--main-content-px)*-1)] flex min-h-9 items-center justify-between bg-[#f3f1ec] px-(--main-content-px) dark:bg-[#1b1a21] lg:mx-0 lg:rounded-lg lg:px-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="mx-[calc(var(--main-content-px)*-1)] bg-white dark:bg-card lg:mx-0 lg:bg-transparent lg:py-1 dark:lg:bg-transparent">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex min-h-16 items-center gap-3 px-(--main-content-px) py-2.5 lg:px-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="h-3.5 w-24 max-w-full" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
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
        <PageHeaderSkeleton action />
        <TransactionsLayout
          summary={<TransactionsHeroSkeleton />}
          filters={<FilterPanelSkeleton />}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-8 max-w-md flex-1 rounded-lg lg:max-w-none" />
              <Skeleton className="h-8 w-20 rounded-lg lg:hidden" />
            </div>
            <div className="flex gap-2 lg:hidden">
              {[16, 20, 20, 28].map((width, index) => (
                <Skeleton key={index} className="h-7 rounded-lg" style={{ width: `${width * 4}px` }} />
              ))}
            </div>
          </div>
          <div className="lg:space-y-6">
            <DayGroupSkeleton rows={3} />
            <DayGroupSkeleton rows={2} />
          </div>
        </TransactionsLayout>
      </div>

      <span className="sr-only">Đang tải dữ liệu giao dịch...</span>
    </Page>
  )
}
