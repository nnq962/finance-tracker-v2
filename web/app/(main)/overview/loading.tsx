import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const cashFlowBarHeights = ["h-20", "h-14", "h-28", "h-16", "h-6", "h-24"]

function SectionSkeleton({
  action = "button",
  children,
}: {
  action?: "badge" | "button"
  children: React.ReactNode
}) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <CardAction>
          <Skeleton
            className={action === "badge" ? "h-6 w-28 rounded-full" : "h-7 w-16 rounded-lg"}
          />
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-9 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-28 max-w-full" />
        <Skeleton className="h-3.5 w-20" />
      </div>
      <Skeleton className="h-4 w-24 shrink-0" />
    </div>
  )
}

export default function OverviewLoading() {
  return (
    <div
      className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-12 md:space-y-8"
      role="status"
      aria-label="Đang tải tổng quan"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-6 md:space-y-8">
        <header className="space-y-1.5 pt-1">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </header>

        <Card className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
          <CardContent className="space-y-5">
            <div>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-2 h-11 w-64 max-w-full sm:h-14" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border-2 border-[#e7e4dd] p-3 sm:flex-col sm:items-start dark:border-[#35323e]"
                >
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 flex-1 sm:w-28 sm:flex-none" />
                  <Skeleton className="h-5 w-24 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionSkeleton action="badge">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className={item === 2 ? "col-span-2 sm:col-span-1" : undefined}>
                  <Skeleton className="h-3.5 w-12" />
                  <Skeleton className="mt-1.5 h-5 w-24" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex h-48 items-end justify-around gap-2 sm:h-56">
              {cashFlowBarHeights.map((height, index) => (
                <div key={index} className="flex items-end gap-0.5">
                  <Skeleton className={`w-4 ${height}`} />
                  <Skeleton className="h-10 w-4" />
                </div>
              ))}
            </div>
          </SectionSkeleton>

          <SectionSkeleton>
            <div className="space-y-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex justify-between gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-[18px] w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </SectionSkeleton>

          <SectionSkeleton>
            <div className="space-y-4">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          </SectionSkeleton>

          <SectionSkeleton>
            <div className="space-y-3">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </div>
          </SectionSkeleton>
        </div>
      </div>

      <span className="sr-only">Đang tải tổng quan tài chính...</span>
    </div>
  )
}
