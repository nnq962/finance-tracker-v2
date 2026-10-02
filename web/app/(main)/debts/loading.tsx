import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"

function DirectionStatSkeleton() {
  return (
    <div className="rounded-xl border-2 border-[#e7e4dd] p-3 sm:p-4 dark:border-[#35323e]">
      <Skeleton className="size-8 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-28 max-w-full" />
      <Skeleton className="mt-1.5 h-6 w-28 max-w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-20" />
    </div>
  )
}

function SummarySkeleton() {
  return (
    <Card className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
      <CardContent className="@container/debt-summary min-w-0">
        <div className="grid min-w-0 gap-6 @min-[48rem]/debt-summary:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] @min-[48rem]/debt-summary:items-center @min-[48rem]/debt-summary:gap-8">
          <div className="min-w-0">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-10 w-52 max-w-full" />
            <Skeleton className="mt-1.5 h-4 w-44 max-w-full" />
            <div className="mt-5 flex gap-1">
              <Skeleton className="h-[18px] flex-[2] rounded-full" />
              <Skeleton className="h-[18px] flex-[3] rounded-full" />
            </div>
            <div className="mt-2 flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DirectionStatSkeleton />
            <DirectionStatSkeleton />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DebtRowSkeleton() {
  return (
    <Card className="gap-3 px-(--card-spacing)">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex justify-between gap-3">
            <Skeleton className="h-5 w-28 max-w-full" />
            <Skeleton className="h-5 w-24 shrink-0" />
          </div>
          <div className="flex justify-between gap-3">
            <Skeleton className="h-3.5 w-32 max-w-full" />
            <Skeleton className="h-3.5 w-16 shrink-0" />
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 pl-[3.25rem]">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex items-center gap-3 pl-[3.25rem]">
        <Skeleton className="h-[18px] flex-1 rounded-full" />
        <Skeleton className="h-4 w-8 shrink-0" />
      </div>
    </Card>
  )
}

function PaymentHistorySkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        {[0, 1].map((index) => (
          <div key={index} className="relative flex min-h-8 items-center gap-2 pl-6">
            <Skeleton className="absolute top-3 left-0 size-2 rounded-full" />
            {index === 0 ? (
              <span className="absolute top-4 bottom-[-12px] left-[3.5px] w-px bg-border" />
            ) : null}
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="h-5 w-24 shrink-0" />
            <Skeleton className="size-7 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="h-16 content-center">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-5 w-28 max-w-full" />
            <Skeleton className="h-5 w-24 max-w-full" />
          </div>
        </div>
      </CardHeader>
      <Separator variant="chunky" />

      <CardContent className="space-y-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <Skeleton className="h-5 w-48 max-w-full" />

        <div className="space-y-3 rounded-lg bg-muted p-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
          <Separator variant="chunky" />
          <div className="flex items-end justify-between gap-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-[18px] w-full rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-1">
              <Skeleton className="h-5 w-24 max-w-full" />
              <Skeleton className="h-5 w-28 max-w-full" />
            </div>
          ))}
        </div>

        <PaymentHistorySkeleton />

        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
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

        <SummarySkeleton />

        <div className="space-y-5">
          <Skeleton className="h-11 w-full rounded-[14px] sm:w-64" />
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Skeleton className="h-8 w-full rounded-lg sm:max-w-xs" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
              <div className="grid gap-3">
                <DebtRowSkeleton />
                <DebtRowSkeleton />
                <DebtRowSkeleton />
              </div>
            </div>
            <div className="hidden xl:block">
              <DetailSkeleton />
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Đang tải danh bạ và các khoản vay nợ...</span>
    </Page>
  )
}
