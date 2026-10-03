import type { Metadata } from "next"

import { Page, PageHeader } from "@/components/page"
import { loadWithSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getNotificationState } from "@/lib/notifications/repository"
import { getPushContext } from "@/lib/notifications/context"
import { isAdmin } from "@/lib/plans/admin"
import { getAdminData } from "@/lib/plans/admin-data"
import { paymentReference } from "@/lib/plans/plans"
import { getPlanState } from "@/lib/plans/repository"

import { SettingsView } from "./_components/settings-view"

export const metadata: Metadata = {
  title: "Cài đặt",
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen } = await searchParams
  const {
    user,
    data: [notifications, categoryGroups, planState, adminData],
  } = await loadWithSession((user) =>
    Promise.all([
      getPushContext()
        .catch(() => undefined)
        .then((context) => getNotificationState(user.uid, context)),
      getCategoryGroups(user.uid),
      getPlanState(user.uid),
      isAdmin(user) ? getAdminData() : undefined,
    ]),
  )
  // Where to pay for Pro, set on the server; the plan screen says to ask the admin until it is.
  const { PAYMENT_BANK_NAME, PAYMENT_ACCOUNT_NUMBER, PAYMENT_ACCOUNT_NAME } = process.env
  const paymentInfo =
    PAYMENT_BANK_NAME && PAYMENT_ACCOUNT_NUMBER && PAYMENT_ACCOUNT_NAME
      ? { bankName: PAYMENT_BANK_NAME, accountNumber: PAYMENT_ACCOUNT_NUMBER, accountName: PAYMENT_ACCOUNT_NAME }
      : undefined

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
        paymentInfo={paymentInfo}
        paymentReference={paymentReference(user.uid)}
        adminData={adminData}
        // Deep link from the getting-started checklist.
        initialScreen={screen === "notifications" ? "notifications" : undefined}
      />
    </Page>
  )
}
