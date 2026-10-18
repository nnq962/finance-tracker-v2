"use client"

import { PageSheetScreen } from "@/components/app/page-sheet"
import { SettingsGroup, settingsSeparatorClassName } from "@/components/settings-list"
import { changeKindLabels, releases, type ChangeKind } from "@/lib/releases"

/** What a version brought, on a screen pushed into the sheet: new, improved, fixed. */
export function ReleaseScreen({ version, onBack }: { version: string | null; onBack: () => void }) {
  const release = releases.find((item) => item.version === version)
  return (
    <PageSheetScreen open={Boolean(release)} title={`Bản ${version}`} onBack={onBack}>
      {release ? <ReleaseChanges release={release} /> : null}
    </PageSheetScreen>
  )
}

function ReleaseChanges({ release }: { release: (typeof releases)[number] }) {
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
