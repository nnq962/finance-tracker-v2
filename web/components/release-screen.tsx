"use client"

import { usePageSheetScreen } from "@/components/app/page-sheet"
import { SettingsGroup, settingsSeparatorClassName } from "@/components/settings-list"
import { changeKindLabels, releases, type ChangeKind } from "@/lib/releases"

/** What a version brought, on a screen of the sheet: new, improved, fixed. */
export function ReleaseScreen({ version, onBack }: { version: string; onBack: () => void }) {
  const release = releases.find((item) => item.version === version)
  usePageSheetScreen({ title: `Bản ${version}`, onBack })
  if (!release) return null
  return (
    <div className="space-y-6">
      <p className="px-4 text-sm text-muted-foreground">{release.title}</p>
      {(["new", "improved", "fixed"] as ChangeKind[]).map((kind) => {
        const changes = release.changes.filter((change) => change.kind === kind)
        return changes.length > 0 ? (
          <SettingsGroup key={kind} title={changeKindLabels[kind]}>
            {changes.map((change) => (
              <li key={change.text} className={`${settingsSeparatorClassName()} px-4 py-3.5 text-sm`}>
                {change.text}
              </li>
            ))}
          </SettingsGroup>
        ) : null
      })}
    </div>
  )
}
