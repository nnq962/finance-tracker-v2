import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton, SettingsRowSkeleton, settingsSeparatorClassName } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Same footprint as AiQuotaGroup's UsageMeter: the allowance and what is left
 * of it on a 24px line, the bar, and the note on a 16px one.
 */
function UsageMeterSkeleton() {
  return (
    <div className={cn("space-y-3 px-4 py-3", settingsSeparatorClassName())}>
      <div className="flex h-6 items-center justify-between gap-3">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-14" />
      </div>
      <Skeleton className="h-2 rounded-full" />
      <div className="flex h-4 items-center">
        <Skeleton className="h-3 w-40 max-w-full" />
      </div>
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <Page
      role="status"
      aria-label="Đang tải cài đặt"
      aria-busy="true"
    >
      <PageHeaderSkeleton title="Cài đặt" />

      {/* The groups of SettingsView, in its one capped column. */}
      <div aria-hidden="true" className="grid gap-6 md:max-w-2xl md:gap-8">
        {/* The profile card: the 48 avatar, name and email, the plan's label. */}
        <Card size="lg" variant="inverse" discs={false}>
          <CardContent className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-40 max-w-full" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </CardContent>
        </Card>
        {/* "Lượt AI": this month's requests, the credits from missions, then the row to the plan. */}
        <SettingsGroupSkeleton>
          <UsageMeterSkeleton />
          <UsageMeterSkeleton />
          <SettingsRowSkeleton description chevron index={1} />
        </SettingsGroupSkeleton>
        {/* "Chung" and "Thông báo": a value and a chevron on each row. */}
        <SettingsGroupSkeleton rows={2} trailing="value" chevron />
        <SettingsGroupSkeleton rows={2} trailing="value" chevron />
        {/* "Ứng dụng": screens to open. */}
        <SettingsGroupSkeleton rows={2} chevron />
        {/* Signing out, centred, with the version under it. */}
        <div className="space-y-2">
          <SettingsGroupSkeleton caption={false} rows={1} align="center" />
          <div className="flex h-4 items-center justify-center px-4">
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      </div>

      <span className="sr-only">Đang tải dữ liệu cài đặt...</span>
    </Page>
  )
}
