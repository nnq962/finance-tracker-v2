import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const cashFlowBarHeights = ["h-10", "h-20", "h-14", "h-28", "h-16", "h-36"]
const spendingBarWidths = ["w-3/4", "w-2/3", "w-1/2", "w-4/5"]

function CardHeadingSkeleton({ action = false }: { action?: boolean }) {
  return (
    <CardHeader>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-64 max-w-full" />
      {action ? <CardAction><Skeleton className="h-8 w-24" /></CardAction> : null}
    </CardHeader>
  )
}

function NetWorthSkeleton() {
  return (
    <Card>
      <CardHeadingSkeleton action />
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Skeleton className="min-h-64 w-full" />
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="min-h-18 w-full" />)}
          </div>
        </div>
        <Skeleton className="h-4 w-3/4 max-w-full" />
      </CardContent>
    </Card>
  )
}

function CashFlowSkeleton() {
  return (
    <Card className="h-full">
      <CardHeadingSkeleton action />
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4 border-b pb-5">
          {[0, 1].map((item) => (
            <div key={item} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-36 max-w-full" />
            </div>
          ))}
        </div>
        <div className="flex h-64 items-end justify-around gap-3 border-b pb-6">
          {cashFlowBarHeights.map((height, index) => (
            <div key={`${height}-${index}`} className="flex flex-1 items-end justify-center gap-1">
              <Skeleton className={`w-5 max-w-1/2 ${height}`} />
              <Skeleton className="h-8 w-5 max-w-1/2" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-4/5 max-w-full" />
      </CardContent>
    </Card>
  )
}

function SpendingSkeleton() {
  return (
    <Card className="h-full">
      <CardHeadingSkeleton action />
      <CardContent className="space-y-5">
        <div className="space-y-2 border-b pb-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex h-64 flex-col justify-around gap-4 py-2">
          {spendingBarWidths.map((width, index) => (
            <div key={`${width}-${index}`} className="flex items-center gap-4">
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className={`h-6 ${width}`} />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-3/5 max-w-full" />
      </CardContent>
    </Card>
  )
}

function DueDebtsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeadingSkeleton action />
      <CardContent className="divide-y">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="h-3 w-44 max-w-full" />
            </div>
            <div className="shrink-0 space-y-2">
              <Skeleton className="ml-auto h-4 w-24" />
              <Skeleton className="ml-auto h-5 w-20" />
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
      <CardHeadingSkeleton action />
      <CardContent className="divide-y">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
            <Skeleton className="size-9 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </div>
            <Skeleton className="h-4 w-24 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function OverviewLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl space-y-6 pb-12 md:space-y-8"
      role="status"
      aria-label="Đang tải tổng quan tài chính"
      aria-busy="true"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-6 w-28" />
      </header>
      <NetWorthSkeleton />
      <div className="grid gap-6 xl:grid-cols-2">
        <CashFlowSkeleton />
        <SpendingSkeleton />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <DueDebtsSkeleton />
        <RecentTransactionsSkeleton />
      </div>
      <span className="sr-only">Đang tải dữ liệu tổng quan...</span>
    </main>
  )
}
