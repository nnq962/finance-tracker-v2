"use client"

import * as React from "react"

import { usePageSheetScreen } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format-date"
import {
  changeKindLabels,
  releaseLevel,
  releaseLevelLabels,
  releases,
  type ChangeKind,
} from "@/lib/releases"

const changeKinds: ChangeKind[] = ["new", "improved", "fixed"]

/**
 * Every version of the app, newest first; one opens on a screen of its own
 * in the sheet with what it brought, grouped as new, improved and fixed.
 */
export function ReleaseHistory() {
  const [openVersion, setOpenVersion] = React.useState<string | null>(null)
  const index = releases.findIndex((release) => release.version === openVersion)
  const release = releases[index]

  usePageSheetScreen(release ? { title: `Phiên bản ${release.version}`, onBack: () => setOpenVersion(null) } : null)

  if (release) {
    return (
      <div className="space-y-6">
        <SettingsGroup
          header={
            <div className="p-6">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold tabular-nums">{release.version}</p>
                <Badge variant="secondary">{releaseLevelLabels[releaseLevel(index)]}</Badge>
              </div>
              <p className="mt-1 text-sm">{release.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">Phát hành {formatDate(release.date)}</p>
            </div>
          }
        >
          {null}
        </SettingsGroup>

        {changeKinds.map((kind) => {
          const changes = release.changes.filter((change) => change.kind === kind)
          if (changes.length === 0) return null
          return (
            <SettingsGroup key={kind} title={changeKindLabels[kind]}>
              {changes.map((change) => (
                <li key={change.text} className={`${settingsSeparatorClassName()} px-4 py-3.5 text-sm`}>
                  {change.text}
                </li>
              ))}
            </SettingsGroup>
          )
        })}
      </div>
    )
  }

  return (
    <SettingsGroup
      title="Các phiên bản"
      footer="Số phiên bản tăng theo mức thay đổi: bản lớn, tính năng mới hoặc cập nhật nhỏ."
    >
      {releases.map((item, itemIndex) => (
        <SettingsRow
          key={item.version}
          title={
            <span className="flex items-center gap-2">
              <span className="tabular-nums">{item.version}</span>
              {itemIndex === 0 ? <Badge>Hiện tại</Badge> : null}
            </span>
          }
          description={`${releaseLevelLabels[releaseLevel(itemIndex)]} · ${item.title}`}
          value={formatDate(item.date)}
          onClick={() => setOpenVersion(item.version)}
        />
      ))}
    </SettingsGroup>
  )
}
