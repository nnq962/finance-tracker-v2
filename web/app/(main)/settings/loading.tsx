import { Page, PageHeaderSkeleton } from "@/components/page"
import { SettingsGroupSkeleton, SettingsRowSkeleton, settingsSeparatorClassName } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { settingsPageClassName } from "./_components/settings-layout"

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

/** A group's footnote under its card: Caption-size lines, 16 high, 16 in from the sides. */
function FootnoteSkeleton({ lines }: { lines: number }) {
  return (
    <div className="px-4">
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="flex h-4 items-center">
          <Skeleton className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")} />
        </div>
      ))}
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <Page
      className={settingsPageClassName}
      role="status"
      aria-label="Đang tải cài đặt"
      aria-busy="true"
    >
      <PageHeaderSkeleton title="Cài đặt" />

      {/* The groups of SettingsView, in its one capped column. */}
      <div aria-hidden="true" className="grid gap-6 md:gap-8">
        {/* The profile card: the 48 avatar, name and email, the plan's label. */}
        <Card size="lg" variant="pastel" blend="profile" discs={false}>
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
        {/* "Chung": a value and a chevron on each row. */}
        <SettingsGroupSkeleton rows={3} trailing="value" chevron />
        {/* "Thông báo": three rows with a value, "Tin từ Timi" with its switch, the two-line footnote. */}
        <div className="space-y-2">
          <SettingsGroupSkeleton>
            {[0, 1, 2].map((index) => (
              <SettingsRowSkeleton key={index} index={index} trailing="value" chevron />
            ))}
            <SettingsRowSkeleton index={3} />
          </SettingsGroupSkeleton>
          <FootnoteSkeleton lines={2} />
        </div>
        {/* "Ứng dụng": screens to open. (The admin's group is not guessed at.) */}
        <SettingsGroupSkeleton rows={2} chevron />
        {/* Wiping the data, centred, with its footnote; then signing out. */}
        <div className="space-y-2">
          <SettingsGroupSkeleton caption={false} rows={1} align="center" />
          <FootnoteSkeleton lines={1} />
        </div>
        <SettingsGroupSkeleton caption={false} rows={1} align="center" />
        {/* The app at the foot: its icon, its name, its version. */}
        <div className="flex flex-col items-center gap-2 pt-2 pb-4">
          <Skeleton className="size-12 rounded-[12px]" />
          <div className="flex h-7 items-center">
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>

      <span className="sr-only">Đang tải dữ liệu cài đặt...</span>
    </Page>
  )
}
