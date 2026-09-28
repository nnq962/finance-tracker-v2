import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AccountsLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Đang tải tài khoản" aria-busy="true">
      <header className="space-y-2 pt-1">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </header>

      <Card className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
        <CardContent className="@container min-w-0">
          <div className="grid min-w-0 items-center gap-5 @min-[48rem]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] @min-[48rem]:gap-8">
            <div className="min-w-0 space-y-3">
              <Skeleton className="h-4 w-44 max-w-full" />
              <Skeleton className="h-10 w-64 max-w-full" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex justify-between gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
              {[0, 1].map((index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between gap-3 sm:hidden">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              </CardContent>
              <CardHeader className="hidden sm:grid">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <CardAction><Skeleton className="size-8" /></CardAction>
              </CardHeader>
              <CardContent className="hidden items-end justify-between gap-3 sm:flex">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-36" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </CardContent>
            </Card>
          ))}
          <Skeleton className="hidden size-full sm:block" />
        </div>
        <Skeleton className="h-11 w-full sm:hidden" />
      </section>
      <span className="sr-only">Đang tải dữ liệu tài khoản...</span>
    </div>
  )
}
