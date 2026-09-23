import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

function SummarySkeleton() {
  return (
    <Card>
      <CardHeader className="grid grid-cols-[1fr_auto] items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-9" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  )
}

function ContactSkeleton() {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28 max-w-full" />
          <Skeleton className="h-3 w-20 max-w-full" />
        </div>
        <Skeleton className="size-8 shrink-0" />
      </CardContent>
    </Card>
  )
}

function DebtTableSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 px-4 py-3 lg:h-16 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-full lg:max-w-xs" />
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <Separator />
      <div className="hidden grid-cols-[minmax(0,1fr)_7rem_6rem] gap-4 px-4 py-3 sm:grid">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="ml-auto h-3 w-16" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index}>
          <Separator />
          <div className="flex items-center gap-3 px-4 py-4">
            <Skeleton className="size-9 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className={`h-4 max-w-full ${index % 2 ? "w-32" : "w-24"}`} />
              <Skeleton className="h-3 w-36 max-w-full" />
            </div>
            <div className="shrink-0 space-y-2">
              <Skeleton className="ml-auto h-4 w-24" />
              <Skeleton className="ml-auto h-3 w-16" />
            </div>
            <Skeleton className="ml-4 hidden h-6 w-20 shrink-0 sm:block" />
          </div>
        </div>
      ))}
    </Card>
  )
}

function DetailSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="h-16 content-center">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-5 py-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-5 w-48 max-w-full" />
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DebtsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-8 pb-24"
      role="status"
      aria-label="Đang tải vay nợ"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-8">
        <header className="space-y-6 pt-1">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-9 w-48 max-w-full" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </div>
            <Skeleton className="h-9 w-36 shrink-0" />
          </div>
          <Separator />
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummarySkeleton />
          <SummarySkeleton />
          <SummarySkeleton />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <ContactSkeleton />
            <ContactSkeleton />
            <ContactSkeleton />
          </div>
        </section>

        <section className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <DebtTableSkeleton />
            <DetailSkeleton />
          </div>
        </section>
      </div>
      <span className="sr-only">Đang tải danh bạ và các khoản vay nợ...</span>
    </div>
  )
}
