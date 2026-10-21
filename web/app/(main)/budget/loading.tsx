import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { accountGridClassName, gridCardClassName, gridCardContentClassName } from "./_components/account-grid"
import { BudgetLayout } from "./_components/budget-layout"

/**
 * Same footprint as BalanceHero: on phones the total's card (with its kinds,
 * as with real data it may have), from lg the grid's first row, the total
 * and three kinds, each a 144 card.
 */
function BalanceHeroSkeleton() {
  return (
    <>
      <Card size="lg" className="lg:hidden">
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex h-[42.5px] items-center">
              <Skeleton className="h-8 w-56 max-w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className={cn(accountGridClassName, "hidden lg:grid")}>
        {[0, 1, 2, 3].map((index) => (
          <GridCardSkeleton key={index} media={index > 0} />
        ))}
      </div>
    </>
  )
}

/** A card of the accounts grid while it loads: 144 tall, a head and a figure. */
function GridCardSkeleton({ media = true }: { media?: boolean }) {
  return (
    <Card size="lg" className={gridCardClassName}>
      <CardContent className={gridCardContentClassName}>
        <div className="flex items-center gap-3">
          {media ? <Skeleton className="size-9 rounded-[10px]" /> : null}
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-5 w-32" />
      </CardContent>
    </Card>
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
        <PageHeaderSkeleton bare />
        <BudgetLayout summary={<BalanceHeroSkeleton />}>
          {/* "Tài khoản chính": on phones each account's logo, name and kind, balance
              and chevron; from lg up AccountCard's footprint in the grid. */}
          <div className="lg:hidden">
            <SettingsGroupSkeleton rows={3} trailing="value" chevron />
          </div>
          <div className="hidden flex-col gap-2 lg:flex">
            <div className="flex h-4 items-center px-4">
              <Skeleton className="h-3 w-24" />
            </div>
            <div className={accountGridClassName}>
              {[0, 1, 2].map((index) => (
                <GridCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </BudgetLayout>
      </div>

      <span className="sr-only">Đang tải dữ liệu tài khoản...</span>
    </Page>
  )
}
