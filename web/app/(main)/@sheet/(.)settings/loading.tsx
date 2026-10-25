import { SettingsSkeleton } from "../../settings/_components/settings-skeleton"

export default function SettingsSheetLoading() {
  return (
    // Boxless, as the page (see there).
    <div role="status" aria-label="Đang tải cài đặt" aria-busy="true" className="contents">
      <SettingsSkeleton />
      <span className="sr-only">Đang tải dữ liệu cài đặt...</span>
    </div>
  )
}
