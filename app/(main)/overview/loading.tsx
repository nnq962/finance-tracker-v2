import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const cashFlowBarHeights = ["h-10", "h-20", "h-14", "h-28", "h-16", "h-36"]
const spendingBarWidths = ["w-3/4", "w-2/3", "w-1/2", "w-4/5", "w-3/5"]

function CardHeadingSkeleton({
  action = "button",
  icon = false,
}: {
  action?: "badge" | "button" | false
  icon?: boolean
}) {
  return (
    <CardHeader>
      <div className="flex items-center gap-2">
        {icon ? <Skeleton className="size-5 shrink-0 rounded-full" /> : null}
        <Skeleton className="h-5 w-40 max-w-full" />
      </div>
      <Skeleton className="h-5 w-64 max-w-full" />
      {action ? (
        <CardAction>
          <Skeleton
            className={
              action === "badge"
                ? "h-6 w-24 rounded-full"
                : "h-7 w-24 rounded-lg"
            }
          />
        </CardAction>
      ) : null}
    </CardHeader>
  )
}

function NetWorthSkeleton() {
  return (
    <Card>
      <CardHeadingSkeleton icon />
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex min-h-64 flex-col justify-between rounded-xl bg-muted p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0 rounded-full bg-background/70" />
              <Skeleton className="h-5 w-36 max-w-full bg-background/70" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-4/5 max-w-full bg-background/70 sm:h-12 xl:h-[3.75rem]" />
              <Skeleton className="h-5 w-72 max-w-full bg-background/70" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex min-h-16 min-w-0 items-center gap-4 rounded-lg bg-muted px-4 py-3"
              >
                <Skeleton className="size-10 shrink-0 rounded-lg bg-background/70" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-5 w-24 max-w-full bg-background/70" />
                  <Skeleton className="h-7 w-32 max-w-full bg-background/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-5 w-3/4 max-w-full" />
      </CardContent>
    </Card>
  )
}

function CashFlowSkeleton() {
  return (
    <Card className="h-full">
      <CardHeadingSkeleton action="badge" />
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4 border-b pb-5">
          {[0, 1].map((item) => (
            <div key={item} className="min-w-0 space-y-1">
              <Skeleton className="h-5 w-24 max-w-full" />
              <Skeleton className="h-7 w-36 max-w-full" />
            </div>
          ))}
        </div>

        <div className="flex h-64 items-end justify-around gap-3 border-b pb-6">
          {cashFlowBarHeights.map((height, index) => (
            <div
              key={`${height}-${index}`}
              className="flex min-w-0 flex-1 items-end justify-center gap-1"
            >
              <Skeleton className={`w-5 max-w-1/2 ${height}`} />
              <Skeleton className="h-8 w-5 max-w-1/2" />
            </div>
          ))}
        </div>

        <Skeleton className="h-4 w-32" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/5 max-w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function SpendingSkeleton() {
  return (
    <Card className="h-full">
      <CardHeadingSkeleton />
      <CardContent className="space-y-5">
        <div className="border-b pb-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-1 h-8 w-40 max-w-full" />
        </div>

        <div className="flex h-64 flex-col justify-around gap-3 py-2">
          {spendingBarWidths.map((width, index) => (
            <div
              key={`${width}-${index}`}
              className="flex min-w-0 items-center gap-4"
            >
              <Skeleton className="h-5 w-24 shrink-0" />
              <Skeleton className={`h-6 max-w-full ${width}`} />
            </div>
          ))}
        </div>

        <Skeleton className="h-5 w-3/5 max-w-full" />
      </CardContent>
    </Card>
  )
}

function DueDebtsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeadingSkeleton />
      <CardContent className="divide-y">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-5 w-32 max-w-full" />
              <Skeleton className="h-5 w-44 max-w-full" />
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 space-y-1">
                <Skeleton className="ml-auto h-5 w-24 max-w-full" />
                <Skeleton className="ml-auto h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="size-4 shrink-0 rounded-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentTransactionsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeadingSkeleton />
      <CardContent className="divide-y">
        {[0, 1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
          >
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-5 w-32 max-w-full" />
              <Skeleton className="h-5 w-48 max-w-full" />
            </div>
            <Skeleton className="col-start-2 h-5 w-24 max-w-full sm:col-start-3 sm:row-start-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function OverviewLoading() {
  return (
    <main
      className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-12 md:space-y-8"
      role="status"
      aria-label="Đang tải tổng quan tài chính"
      aria-busy="true"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64 max-w-full sm:h-9" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </header>

      <NetWorthSkeleton />

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <CashFlowSkeleton />
        <SpendingSkeleton />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <DueDebtsSkeleton />
        <RecentTransactionsSkeleton />
      </div>

      <span className="sr-only">Đang tải dữ liệu tổng quan...</span>
    </main>
  )
}
