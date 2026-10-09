import { FloatingActionsSkeleton } from "@/components/app/floating-actions"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { BudgetLayout, budgetPageClassName } from "./_components/budget-layout"

/**
 * Same footprint as BalanceHero with its kinds listed: the label's 20px line,
 * the total's 42.5px one (34px at leading-tight) beside the kinds' discs,
 * then three 48 lines in their box.
 */
function BalanceHeroSkeleton() {
  return (
    <Card size="lg" variant="inverse" discs={false}>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex h-[42.5px] items-center">
              <Skeleton className="h-8 w-56 max-w-full" />
            </div>
          </div>
          <Skeleton className="mt-1 h-9 w-20 rounded-full" />
        </div>
        <div className="mt-5 flex flex-col rounded-2xl bg-inverse-foreground/[0.07] px-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex h-12 items-center gap-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="ml-auto h-3.5 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AccountsLoading() {
  return (
    <Page
      className={budgetPageClassName}
      role="status"
      aria-label="Đang tải tài khoản"
      aria-busy="true"
    >
      <div aria-hidden="true" className="space-y-6 md:space-y-8">
        <PageHeaderSkeleton title="Tài khoản" actions={["w-44"]} />
        <BudgetLayout summary={<BalanceHeroSkeleton />}>
          {/* "Đang dùng": each account's logo, name and kind, balance and chevron. */}
          <SettingsGroupSkeleton rows={3} description trailing="value" chevron />
        </BudgetLayout>
        <FloatingActionsSkeleton />
      </div>

      <span className="sr-only">Đang tải dữ liệu tài khoản...</span>
    </Page>
  )
}
