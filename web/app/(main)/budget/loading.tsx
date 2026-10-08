import { FloatingActionsSkeleton } from "@/components/app/floating-actions"
import { Stat, StatGroup } from "@/components/app/stat-group"
import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { BudgetLayout, budgetPageClassName } from "./_components/budget-layout"

/**
 * Same footprint as BalanceHero with its split by kind, about 200 high: the
 * label's 20px line, the total's 42.5px one (34px at leading-tight), then the
 * three kinds under a line.
 */
function BalanceHeroSkeleton() {
  return (
    <Card size="lg" variant="inverse">
      <CardContent className="flex flex-col gap-1">
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="flex h-[42.5px] items-center">
          <Skeleton className="h-8 w-56 max-w-full" />
        </div>
        <StatGroup separated className="mt-4">
          {[0, 1, 2].map((index) => (
            <Stat
              key={index}
              value={<Skeleton className="h-3.5 w-12" />}
              label={<Skeleton className="mt-1.5 h-3 w-16 max-w-full" />}
            />
          ))}
        </StatGroup>
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
