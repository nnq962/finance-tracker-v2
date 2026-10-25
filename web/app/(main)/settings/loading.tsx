import { ScreenHeader } from "@/components/app/screen-header"
import { Page, PageHeaderSkeleton } from "@/components/page"

import { settingsPageClassName } from "./_components/settings-layout"
import { SettingsSkeleton } from "./_components/settings-skeleton"

export default function SettingsLoading() {
  return (
    <Page
      className={settingsPageClassName}
      role="status"
      aria-label="Đang tải cài đặt"
      aria-busy="true"
    >
      <div className="md:hidden">
        <ScreenHeader title="Cài đặt" backLabel="Về Tổng quan" />
        <div data-hide-tab-bar="page" hidden />
      </div>
      <div className="max-md:hidden">
        <PageHeaderSkeleton title="Cài đặt" />
      </div>

      <SettingsSkeleton />

      <span className="sr-only">Đang tải dữ liệu cài đặt...</span>
    </Page>
  )
}
