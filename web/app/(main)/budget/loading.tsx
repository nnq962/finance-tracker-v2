import { Card, CardContent } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

function BalanceHeroSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36 max-w-full" />
          <Skeleton className="h-9 w-52 max-w-full" />
        </div>
        <Skeleton className="h-[18px] w-full rounded-full" />
        <Skeleton className="h-3 w-44 max-w-full" />
      </CardContent>
    </Card>
  )
}

/** Same footprint as the accounts SettingsGroup. */
function AccountsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="mx-3 h-3 w-20" />
      <Card size="sm" className="gap-0 py-0">
        <div className="px-1">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className={cn("flex items-center gap-2.5 px-3 py-3.5", settingsSeparatorClassName(true))}>
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32 max-w-full" />
                <Skeleton className="h-3.5 w-24 max-w-full" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3.5 w-10" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function AccountsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải ngân sách"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-6 md:space-y-8">
        <PageHeaderSkeleton action />
        <BalanceHeroSkeleton />
        <AccountsSkeleton rows={4} />
      </div>

      <span className="sr-only">Đang tải dữ liệu ngân sách...</span>
    </Page>
  )
}
