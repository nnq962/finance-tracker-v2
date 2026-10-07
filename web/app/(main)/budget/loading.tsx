import { Card } from "@/components/ui/card"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

import { BudgetLayout } from "./_components/budget-layout"

/** Same footprint as BalanceHero: the label and the total. */
function BalanceHeroSkeleton() {
  return (
    <Card size="lg" className="gap-2 px-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-56 max-w-full" />
    </Card>
  )
}

/** Same footprint as the account list: its caption, then rows with a logo, name and balance. */
function AccountListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center px-4">
        <Skeleton className="h-3 w-20" />
      </div>
      <Card className="gap-0 py-0">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className={cn("flex min-h-16 items-center gap-3 px-4", settingsSeparatorClassName(true))}>
            <Skeleton className="size-9 shrink-0 rounded-[10px]" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="h-3 w-24 max-w-full" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </Card>
    </div>
  )
}

export default function AccountsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải tài khoản"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-6 md:space-y-8">
        <div className="max-md:hidden">
          <PageHeaderSkeleton action />
        </div>
        <BudgetLayout summary={<BalanceHeroSkeleton />}>
          <AccountListSkeleton rows={3} />
        </BudgetLayout>
      </div>

      <span className="sr-only">Đang tải dữ liệu tài khoản...</span>
    </Page>
  )
}
