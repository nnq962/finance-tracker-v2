import type { Metadata } from "next"

import { ScreenHeader } from "@/components/app/screen-header"
import { Page, PageHeader } from "@/components/page"

import { settingsPageClassName } from "./_components/settings-layout"
import { SettingsContent, type SettingsSearchParams } from "./_components/settings-content"

export const metadata: Metadata = {
  title: "Cài đặt",
}

/**
 * Settings as a page: opened straight from its address (a bookmark, a
 * notification, the way back from payOS) and from md up. Opened from inside
 * the app on a phone it rises in a sheet instead (@sheet/(.)settings).
 */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<SettingsSearchParams> }) {
  return (
    <Page className={settingsPageClassName}>
      {/* On phones Settings is pushed in from the overview's avatar (2026-10-19): the sheet-like bar
          with a back button. From md it is a sidebar page like the others. A hidden header is out
          of the accessibility tree, so one h1 remains. */}
      <div className="md:hidden">
        <ScreenHeader title="Cài đặt" backLabel="Về Tổng quan" />
        {/* The tab bar slides away while Settings is open and back when it closes (2026-10-19), as a pushed screen on iOS. */}
        <div data-hide-tab-bar="page" hidden />
      </div>
      {/* From md no visible name (2026-10-21), as Tài khoản and Giao dịch: the sidebar names the page. */}
      <div className="max-md:hidden">
        <PageHeader title="Cài đặt" bare phoneBar={false} />
      </div>

      <SettingsContent searchParams={await searchParams} />
    </Page>
  )
}
