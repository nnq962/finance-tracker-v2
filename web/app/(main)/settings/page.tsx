import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/page"
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
    <Page>
      <PageHeader
        title="Cài đặt"
        description="Quản lý tài khoản, giao diện, hạng mục và cách bạn nhận thông báo."
      />

      <SettingsView
        key={user.uid}
        user={user}
        notifications={notifications}
        categoryGroups={categoryGroups}
      />
    </Page>
  )
}
