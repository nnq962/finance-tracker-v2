import { Card } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

import { BudgetLayout } from "./_components/budget-layout"

/** Same footprint as a SettingsGroup caption, with an amount when `total`. */
function CaptionSkeleton({ total = false }: { total?: boolean }) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-3 px-3">
      <Skeleton className="h-3 w-20" />
      {total ? <Skeleton className="h-3 w-24" /> : null}
    </div>
  )
}

/** Same footprint as SettingsRows with an icon or logo, title and amount. */
function RowsSkeleton({ rows, round }: { rows: number; round?: boolean }) {
  return (
    <div className="px-1">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className={cn("flex items-center gap-2.5 px-3 py-3.5 not-first:pt-4", settingsSeparatorClassName(true))}>
          <Skeleton className={cn("size-8 shrink-0", round ? "rounded-full" : "rounded-lg")} />
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
  )
}

/** Same footprint as BalanceHero: the total and bar, then a row per type. */
function BalanceHeroSkeleton() {
  return (
    <div className="space-y-2">
      <CaptionSkeleton />
      <Card size="sm" className="gap-0 py-0">
        <div className="space-y-3 p-4">
          <Skeleton className="h-9 w-52 max-w-full" />
          <Skeleton className="h-[18px] w-full rounded-full" />
          <Skeleton className="h-3 w-44 max-w-full" />
        </div>
        <RowsSkeleton rows={3} />
      </Card>
    </div>
  )
}

/** Same footprint as one account type's SettingsGroup. */
function AccountGroupSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      <CaptionSkeleton total />
      <Card size="sm" className="gap-0 py-0">
        <RowsSkeleton rows={rows} round />
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
        <BudgetLayout summary={<BalanceHeroSkeleton />}>
          <div className="space-y-6">
            <AccountGroupSkeleton rows={2} />
            <AccountGroupSkeleton rows={1} />
          </div>
        </BudgetLayout>
      </div>

      <span className="sr-only">Đang tải dữ liệu ngân sách...</span>
    </Page>
  )
}
