import { SettingsContent, type SettingsSearchParams } from "../../settings/_components/settings-content"

/** /settings opened from inside the app: the same list as the page, in SettingsSheet (the layout). */
export default async function SettingsSheetPage({ searchParams }: { searchParams: Promise<SettingsSearchParams> }) {
  return (
    // Boxless, so Next, scrolling a new page into view, passes over it to the sheet's anchor (SettingsSheet).
    <div className="contents">
      <SettingsContent searchParams={await searchParams} />
    </div>
  )
}
