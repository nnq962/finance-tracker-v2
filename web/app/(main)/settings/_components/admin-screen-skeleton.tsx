import { SettingsGroupSkeleton } from "@/components/settings-list"

/** The admin screens' outline while their data loads, opened from settings. */
export function AdminScreenSkeleton() {
  return (
    <div role="status" aria-label="Đang tải" className="space-y-6">
      <SettingsGroupSkeleton rows={2} trailing="value" />
      <SettingsGroupSkeleton rows={5} description trailing="value" chevron />
    </div>
  )
}
