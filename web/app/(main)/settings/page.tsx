import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/page"
import { loadWithSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getNotificationState } from "@/lib/notifications/repository"
import { getPushContext } from "@/lib/notifications/context"
import { isAdmin } from "@/lib/plans/admin"
import { getAdminData } from "@/lib/plans/admin-data"
import { checkReturningPayment, getPayOS } from "@/lib/plans/payos"
import { getPlanState } from "@/lib/plans/repository"

import { SettingsView } from "./_components/settings-view"

export const metadata: Metadata = {
  title: "Cài đặt",
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string; order?: string }>
}) {
  const { screen, order } = await searchParams
  const {
    user,
    data: [notifications, categoryGroups, planState, adminData, paymentOutcome],
  } = await loadWithSession(async (user) => {
    // Settled first, so the plan read next already shows it.
    const paymentOutcome = await checkReturningPayment(user.uid, order)
    return Promise.all([
      getPushContext()
        .catch(() => undefined)
        .then((context) => getNotificationState(user.uid, context)),
      getCategoryGroups(user.uid),
      getPlanState(user.uid),
      isAdmin(user) ? getAdminData() : undefined,
      paymentOutcome,
    ])
  })

  return (
    <Page>
      <PageHeader
        title="Cài đặt"
      />

      <SettingsView
        key={user.uid}
        user={user}
        notifications={notifications}
        categoryGroups={categoryGroups}
        planState={planState}
        checkoutEnabled={getPayOS() !== null}
        paymentOutcome={paymentOutcome}
        adminData={adminData}
        // Deep links: the getting-started checklist, and the way back from payOS.
        initialScreen={screen === "notifications" || screen === "plan" ? screen : undefined}
      />
    </Page>
  )
}
