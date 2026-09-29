import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const transactionRows = [
  { titleWidth: "w-24", descriptionWidth: "w-32", amountWidth: "w-24" },
  { titleWidth: "w-32", descriptionWidth: "w-40", amountWidth: "w-28" },
]

function CashFlowCardSkeleton() {
  return (
    <Card className="h-44">
      <CardHeader>
        <Skeleton className="h-6 w-16 rounded-full" />
        <CardAction>
          <div className="flex items-center gap-1">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <Skeleton className="h-10 w-44 max-w-full" />
          <Separator className="data-horizontal:h-0! border-t-2 border-dashed border-[#e7e4dd] bg-transparent dark:border-[#35323e]" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function TopExpenseCardSkeleton() {
  return (
    <Card className="h-44 md:col-span-2 lg:col-span-1">
      <CardHeader>
        <Skeleton className="h-5 w-40 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-1">
        <div className="w-full space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-5 w-24 max-w-full" />
              <Skeleton className="h-5 w-28 max-w-full" />
            </div>
            <Skeleton className="h-8 w-12 shrink-0" />
          </div>
          <Skeleton className="h-[18px] w-full rounded-full" />
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32 max-w-full" />
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
    <div
      className="mx-auto w-full max-w-7xl space-y-8 pb-12"
      role="status"
      aria-label="Đang tải giao dịch"
      aria-busy="true"
    >
      <header className="pt-1">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg sm:w-36" />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CashFlowCardSkeleton />
        <CashFlowCardSkeleton />
        <TopExpenseCardSkeleton />
      </section>

      <TransactionToolbarSkeleton />

      <section>
        <TransactionGroupSkeleton showConnector />
        <TransactionGroupSkeleton showConnector={false} singleRow />
      </section>

      <span className="sr-only">Đang tải dữ liệu giao dịch...</span>
    </div>
  )
}
