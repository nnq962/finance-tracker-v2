import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const filterWidths = ["w-20", "w-24", "w-24", "w-32"]
const transactionRows = [
  { titleWidth: "w-24", descriptionWidth: "w-32", amountWidth: "w-24" },
  { titleWidth: "w-32", descriptionWidth: "w-40", amountWidth: "w-28" },
]

function CashFlowCardSkeleton() {
  return (
    <Card className="h-44">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="space-y-5">
        <Skeleton className="h-9 w-40 max-w-full" />
        <Separator />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

function TransactionGroupSkeleton({ second = false }: { second?: boolean }) {
  const rows = second ? transactionRows.slice(0, 1) : transactionRows

  return (
    <section className="relative pl-8 sm:pl-10">
      <Skeleton className="absolute top-1.5 left-0 z-10 size-2.5 rounded-full" />

      <div className="flex min-h-6 items-start justify-between gap-4">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center gap-2 pt-0.5">
          <Skeleton className="h-3 w-24" />
          {!second ? (
            <>
              <Skeleton className="size-1 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : null}
        </div>
      </div>

      <Card size="sm" className="mt-2">
        <CardContent className="-my-3">
          {rows.map((row, index) => (
            <div key={row.titleWidth}>
              {index > 0 ? <Separator /> : null}
              <div className="flex items-center gap-3 py-2.5 sm:gap-4">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className={`h-4 ${row.titleWidth}`} />
                  <Skeleton className={`h-3 ${row.descriptionWidth} max-w-full`} />
                </div>
                <div className="shrink-0 space-y-2">
                  <Skeleton className={`ml-auto h-4 ${row.amountWidth}`} />
                  <Skeleton className="ml-auto h-3 w-10" />
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
      <header className="space-y-6 pt-1">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <Separator />
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CashFlowCardSkeleton />
        <CashFlowCardSkeleton />
        <Card className="h-44 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2 xl:space-y-4">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between xl:gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex gap-1 overflow-hidden pb-1">
              {filterWidths.map((width, index) => (
                <Skeleton
                  key={`${width}-${index}`}
                  className={`h-9 shrink-0 ${width}`}
                />
              ))}
            </div>
            <Skeleton className="hidden h-4 w-36 xl:block" />
          </div>

          <div className="flex items-center gap-2 overflow-hidden pb-1 xl:justify-end xl:pb-0">
            <Skeleton className="h-9 w-36 shrink-0" />
            <Skeleton className="h-9 w-32 shrink-0" />
            <Skeleton className="size-9 shrink-0" />
          </div>
        </div>
      </section>

      <section className="relative space-y-6 before:absolute before:inset-y-2 before:left-[4.5px] before:w-px before:bg-muted-foreground/20">
        <TransactionGroupSkeleton />
        <TransactionGroupSkeleton second />
      </section>

      <span className="sr-only">Đang tải dữ liệu giao dịch...</span>
    </div>
  )
}
