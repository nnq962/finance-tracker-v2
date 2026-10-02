import type { Metadata } from "next"

import { loadWithSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getNotificationState } from "@/lib/notifications/repository"
import { getPushContext } from "@/lib/notifications/context"

import { SettingsView } from "./_components/settings-view"

export const metadata: Metadata = {
  title: "Cài đặt",
}

export default async function SettingsPage() {
  const {
    user,
    data: [notifications, categoryGroups],
  } = await loadWithSession((user) =>
    Promise.all([
      getPushContext()
        .catch(() => undefined)
        .then((context) => getNotificationState(user.uid, context)),
      getCategoryGroups(user.uid),
    ]),
  )

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="pt-1">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Cài đặt</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Quản lý tài khoản, giao diện, hạng mục và cách bạn nhận thông báo.
          </p>
        </div>
      </header>

      <SettingsView
        key={user.uid}
        user={user}
        notifications={notifications}
        categoryGroups={categoryGroups}
      />
    </div>
  )
}
