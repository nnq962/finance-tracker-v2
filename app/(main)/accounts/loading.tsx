import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const distributionRows = ["w-24", "w-32", "w-28", "w-36", "w-20"]

export default function AccountsLoading() {
  return (
    <div
      className="space-y-8"
      role="status"
      aria-label="Đang tải tài khoản"
      aria-busy="true"
    >
      <header className="space-y-6 pt-1">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <Separator />
      </header>

      <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(7)] lg:[--card-spacing:--spacing(8)]">
        <CardContent className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-12 w-72 max-w-full" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="size-1 rounded-full" />
                <Skeleton className="h-4 w-48 max-w-full" />
              </div>
            </div>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.8fr)] lg:gap-12">
            <div className="relative mx-auto aspect-square w-full max-w-64">
              <Skeleton className="size-full rounded-full" />
              <div className="absolute inset-12 flex flex-col items-center justify-center gap-2 rounded-full bg-card">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-14" />
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="hidden grid-cols-[minmax(8rem,0.8fr)_minmax(7rem,1.4fr)_minmax(7rem,auto)_3.5rem] gap-4 md:grid">
                <Skeleton className="ml-5 h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="ml-auto h-4 w-12" />
                <Skeleton className="ml-auto h-4 w-5" />
              </div>

              {distributionRows.map((width, index) => (
                <div
                  key={`${width}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(8rem,0.8fr)_minmax(7rem,1.4fr)_minmax(7rem,auto)_3.5rem]"
                >
                  <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2.5">
                    <Skeleton className="size-2.5 shrink-0" />
                    <Skeleton className={`h-4 ${width}`} />
                  </div>
                  <Skeleton className="col-start-1 row-start-2 h-1 w-full md:col-start-2 md:row-start-1" />
                  <Skeleton className="col-start-2 row-start-1 ml-auto h-4 w-24 md:col-start-3" />
                  <Skeleton className="col-start-2 row-start-2 ml-auto h-4 w-10 md:col-start-4 md:row-start-1" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <CardAction>
                  <Skeleton className="size-8" />
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <span className="sr-only">Đang tải dữ liệu tài khoản...</span>
    </div>
  )
}
