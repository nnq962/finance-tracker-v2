import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const groupRows = ["w-24", "w-32", "w-28", "w-36", "w-24"]
const itemChips = ["w-24", "w-28", "w-20", "w-32", "w-28"]

function CategoriesToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex h-10 w-full items-center gap-1 rounded-[14px] bg-[#e7e4dd] p-1 dark:bg-[#44424a] sm:w-fit">
        <Skeleton className="h-8 flex-1 rounded-[10px] bg-background sm:w-28" />
        <Skeleton className="h-8 flex-1 rounded-[10px] sm:w-28" />
      </div>

      <div className="flex h-8 w-full items-center gap-2 rounded-lg border-2 border-[#e7e4dd] bg-white px-2 dark:border-[#35323e] dark:bg-input/30 sm:w-72">
        <Skeleton className="size-4 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-36 max-w-full" />
      </div>
    </div>
  )
}

function CategoryGroupListSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-1">
          {groupRows.map((width, index) => (
            <div
              key={`${width}-${index}`}
              className="flex h-9 items-center gap-1.5 px-2.5"
            >
              <Skeleton className="size-7 shrink-0 rounded-md" />
              <Skeleton className={`h-4 max-w-full ${width}`} />
              <Skeleton className="ml-auto size-6 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryDetailsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1 py-0.5">
            <Skeleton className="h-5 w-32 max-w-full" />
            <Skeleton className="h-5 w-36 max-w-full" />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex flex-wrap gap-2">
          {itemChips.map((width, index) => (
            <Skeleton
              key={`${width}-${index}`}
              className={`h-8 rounded-lg ${width}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function CategoriesLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-8 pb-12"
      role="status"
      aria-label="Đang tải hạng mục"
      aria-busy="true"
    >
      <header className="pt-1">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-9 w-64 max-w-full" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg sm:w-44" />
        </div>
      </header>

      <div className="space-y-6">
        <CategoriesToolbarSkeleton />

        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.38fr)_minmax(0,1fr)]">
          <CategoryGroupListSkeleton />
          <CategoryDetailsSkeleton />
        </div>
      </div>

      <span className="sr-only">Đang tải dữ liệu hạng mục...</span>
    </div>
  )
}
