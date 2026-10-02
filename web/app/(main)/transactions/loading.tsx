import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"

const transactionRows = [
  { titleWidth: "w-24", descriptionWidth: "w-32", amountWidth: "w-24" },
  { titleWidth: "w-32", descriptionWidth: "w-40", amountWidth: "w-28" },
]

function CashFlowStatSkeleton() {
  return (
    <div className="rounded-xl border-2 border-[#e7e4dd] p-3 sm:p-4 dark:border-[#35323e]">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-14" />
      <Skeleton className="mt-1.5 h-6 w-28 max-w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-20" />
    </div>
  )
}

function TransactionsHeroSkeleton() {
  return (
    <Card className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
      <CardContent className="@container/transactions-hero min-w-0">
        <div className="grid min-w-0 gap-6 @min-[52rem]/transactions-hero:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1fr)] @min-[52rem]/transactions-hero:gap-8">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-44 max-w-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-10 w-52 max-w-full" />
            <Skeleton className="mt-1.5 h-4 w-40" />
            <div className="mt-5 flex gap-1">
              <Skeleton className="h-[18px] flex-[3] rounded-full" />
              <Skeleton className="h-[18px] flex-[2] rounded-full" />
            </div>
            <div className="mt-2 flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <CashFlowStatSkeleton />
              <CashFlowStatSkeleton />
            </div>
          </div>

          <Separator
            orientation="vertical"
            variant="chunky"
            className="hidden @min-[52rem]/transactions-hero:block"
          />
          <Separator
            variant="chunky"
            className="@min-[52rem]/transactions-hero:hidden"
          />

          <div className="min-w-0">
            <Skeleton className="h-5 w-40 max-w-full" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-24 max-w-full" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-20 shrink-0" />
                  <Skeleton className="h-4 w-8 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TransactionToolbarSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border-2 border-[#e7e4dd] bg-[#f3f1ec] px-2 dark:border-[#35323e] dark:bg-[#1b1a21]">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-28 max-w-full" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
        <Skeleton className="size-8 shrink-0 rounded-lg" />
      </div>

      <div className="flex items-center gap-1.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="size-1 rounded-full" />
        <Skeleton className="h-5 w-32 max-w-full" />
      </div>

      <Separator />
    </section>
  )
}

function TransactionGroupSkeleton({
  showConnector,
  singleRow = false,
}: {
  showConnector: boolean
  singleRow?: boolean
}) {
  const rows = singleRow ? transactionRows.slice(0, 1) : transactionRows

  return (
    <section className="relative mb-[26px] pl-[38px] last:mb-0">
      <span
        className={`absolute top-[22px] left-[11px] border-l-[3px] border-dashed border-[#d9d5cc] dark:border-[#4a4656] ${
          showConnector ? "bottom-[-30px]" : "bottom-0"
        }`}
        aria-hidden="true"
      />
      <Skeleton className="absolute top-0.5 left-0 z-10 size-[25px] rounded-full" />

      <div className="mb-3 flex min-h-[27px] flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-[3px]">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Skeleton className="h-4 w-24" />
          {!singleRow ? (
            <>
              <Skeleton className="size-1 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </>
          ) : null}
        </div>
      </div>

      <Card size="sm">
        <CardContent className="-my-3">
          {rows.map((row, index) => (
            <div key={row.titleWidth}>
              {index > 0 ? <Separator /> : null}
              <div className="flex items-center gap-3 py-2.5 sm:gap-4">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton
                    className={`h-5 max-w-full ${row.titleWidth}`}
                  />
                  <Skeleton
                    className={`h-4 max-w-full ${row.descriptionWidth}`}
                  />
                </div>
                <div className="shrink-0 space-y-1">
                  <Skeleton
                    className={`ml-auto h-5 ${row.amountWidth}`}
                  />
                  <Skeleton className="ml-auto h-4 w-10" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

export default function TransactionsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải giao dịch"
      aria-busy="true"
    >
      <PageHeaderSkeleton action />

      <TransactionsHeroSkeleton />

      <TransactionToolbarSkeleton />

      <section>
        <TransactionGroupSkeleton showConnector />
        <TransactionGroupSkeleton showConnector={false} singleRow />
      </section>

      <span className="sr-only">Đang tải dữ liệu giao dịch...</span>
    </Page>
  )
}
