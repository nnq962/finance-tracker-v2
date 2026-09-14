import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const groupRows = ["w-24", "w-32", "w-28", "w-36", "w-24"]
const itemChips = ["w-24", "w-28", "w-20", "w-32"]

export default function CategoriesLoading() {
  return (
    <div
      className="space-y-8"
      role="status"
      aria-label="Đang tải hạng mục"
      aria-busy="true"
    >
      <header className="space-y-6 pt-1">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64 max-w-full" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <Separator />
      </header>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-8 w-full items-center gap-1 rounded-lg bg-muted p-1 sm:w-fit">
            <Skeleton className="h-6 flex-1 bg-background sm:w-24" />
            <Skeleton className="h-6 flex-1 sm:w-24" />
          </div>
          <Skeleton className="h-8 w-full sm:w-72" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.38fr)_minmax(0,1fr)]">
          <Card>
            <CardContent className="space-y-1">
              {groupRows.map((width, index) => (
                <div
                  key={`${width}-${index}`}
                  className="flex h-9 items-center gap-2 px-2.5"
                >
                  <Skeleton className="size-7 shrink-0" />
                  <Skeleton className={`h-4 ${width}`} />
                  <Skeleton className="ml-auto size-6 shrink-0 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Skeleton className="size-8" />
                  <Skeleton className="size-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-4 h-3 w-32" />
              <div className="flex flex-wrap gap-2">
                {itemChips.map((width, index) => (
                  <Skeleton
                    key={`${width}-${index}`}
                    className={`h-8 ${width}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <span className="sr-only">Đang tải dữ liệu hạng mục...</span>
    </div>
  )
}
