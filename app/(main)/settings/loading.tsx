import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

function AccountSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40 max-w-full" />
        <CardAction>
          <Skeleton className="h-6 w-28 rounded-full" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-5 w-36 max-w-full" />
            <Skeleton className="h-5 w-60 max-w-full" />
          </div>
        </div>
        <div className="flex shrink-0 justify-end">
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

function AppearanceSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </CardContent>
    </Card>
  )
}

function NotificationSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-[30px] w-[52px] shrink-0 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
        <Separator />
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-5 w-48 max-w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-8"
      role="status"
      aria-label="Đang tải cài đặt"
      aria-busy="true"
    >
      <header className="space-y-1.5 pt-1" aria-hidden="true">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-5 w-[28rem] max-w-full sm:h-6" />
      </header>

      <div className="grid items-start gap-6 md:grid-cols-[14rem_minmax(0,1fr)]" aria-hidden="true">
        <Card size="sm" className="sticky top-20 hidden md:flex">
          <CardContent className="space-y-1">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex h-8 items-center gap-2">
                <Skeleton className="size-4 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6 md:space-y-0">
          <AccountSettingsSkeleton />
          <div className="md:hidden">
            <AppearanceSettingsSkeleton />
          </div>
          <div className="md:hidden">
            <NotificationSettingsSkeleton />
          </div>
        </div>
      </div>

      <span className="sr-only">Đang tải dữ liệu cài đặt...</span>
    </div>
  )
}
