import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"

const distributionRows = [
  { nameWidth: "w-20", balanceWidth: "w-24" },
  { nameWidth: "w-28", balanceWidth: "w-28" },
  { nameWidth: "w-16", balanceWidth: "w-20" },
]

function BalanceHeroSkeleton() {
  return (
    <Card className="relative [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
      <CardContent className="@container/hero min-w-0">
        <Skeleton className="absolute top-(--card-spacing) right-(--card-spacing) h-6 w-20 rounded-full @min-[48rem]:hidden" />

        <div className="grid min-w-0 items-center gap-5 @min-[48rem]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] @min-[48rem]:gap-8">
          <div className="min-w-0 pr-28 @min-[48rem]:pr-0">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-36 max-w-full" />
            </div>
            <Skeleton className="mt-2 h-9 w-52 max-w-full @min-[28rem]:h-10 @min-[28rem]:w-64" />
            <div className="mt-1 hidden items-center gap-1 @min-[48rem]:flex">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="size-1 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          <div className="@container/distribution min-w-0">
            <Skeleton className="mb-3 h-4 w-36" />
            <Skeleton className="mb-4 h-[18px] w-full rounded-full" />
            <div className="grid min-w-0 grid-cols-1 gap-y-2.5">
              {distributionRows.map((row, index) => (
                <div
                  key={index}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 @min-[20rem]/distribution:grid-cols-[minmax(0,1fr)_auto_3ch]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Skeleton className="size-2.5 shrink-0 rounded-full" />
                    <Skeleton className={`h-4 max-w-full ${row.nameWidth}`} />
                  </div>
                  <Skeleton
                    className={`col-start-1 row-start-2 ml-4.5 h-4 ${row.balanceWidth} @min-[20rem]/distribution:col-start-2 @min-[20rem]/distribution:row-start-1 @min-[20rem]/distribution:ml-0`}
                  />
                  <Skeleton className="col-start-2 row-start-1 h-4 w-7 justify-self-end @min-[20rem]/distribution:col-start-3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AccountCardSkeleton() {
  return (
    <>
      <Card
        pressable
        className="min-w-0 flex-row items-center justify-between gap-3 px-(--card-spacing) sm:hidden"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-5 w-24 max-w-full" />
            <Skeleton className="h-4 w-20 max-w-full" />
          </div>
        </div>
        <div className="flex max-w-[55%] shrink-0 flex-col items-end gap-1.5">
          <Skeleton className="h-6 w-24 max-w-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </Card>

      <Card className="relative hidden sm:flex">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-5 w-28 max-w-full" />
              <Skeleton className="h-4 w-20 max-w-full" />
            </div>
          </div>
          <CardAction>
            <Skeleton className="size-8 rounded-lg" />
          </CardAction>
        </CardHeader>
        <CardContent className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-36 max-w-full" />
          </div>
          <Skeleton className="h-6 w-12 shrink-0 rounded-full" />
        </CardContent>
      </Card>
    </>
  )
}

export default function AccountsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải ngân sách"
      aria-busy="true"
    >
      <PageHeaderSkeleton action />

      <BalanceHeroSkeleton />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>

        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
          <AccountCardSkeleton />
          <AccountCardSkeleton />
        </div>
      </section>

      <span className="sr-only">Đang tải dữ liệu ngân sách...</span>
    </Page>
  )
}
