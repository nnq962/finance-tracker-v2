import type { Metadata } from "next"

import { loadWithSession } from "@/lib/auth/session"
import { getNotificationState } from "@/lib/notifications/repository"
import { getPushContext } from "@/lib/notifications/context"

import { SettingsView } from "./_components/settings-view"

export const metadata: Metadata = {
  title: "Cài đặt",
}

export default async function SettingsPage() {
  const { user, data: notifications } = await loadWithSession(async (user) => {
    const context = await getPushContext().catch(() => undefined)
    return getNotificationState(user.uid, context)
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="pt-1">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Cài đặt</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Quản lý tài khoản, giao diện và cách bạn nhận thông báo.
          </p>
        </div>
      </header>

      <SettingsView key={user.uid} user={user} notifications={notifications} />
    </div>
  )
}
