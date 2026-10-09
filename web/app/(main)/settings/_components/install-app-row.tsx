"use client"

import * as React from "react"
import { DownloadIcon } from "lucide-react"

import { IosInstallSheet, usePwaInstall } from "@/components/pwa-install-button"
import { SettingsRow } from "@/components/settings-list"

/** Offers installing the app; hidden once installed or where not possible. */
export function InstallAppRow() {
  const { available, isIOS, install } = usePwaInstall()
  const [guideOpen, setGuideOpen] = React.useState(false)

  if (!available) return null

  return (
    <>
      <SettingsRow
        icon={DownloadIcon}
        tone="slate"
        title="Cài ứng dụng"
        description="Mở nhanh từ Màn hình chính"
        onClick={() => (isIOS ? setGuideOpen(true) : void install())}
      />
      {isIOS ? <IosInstallSheet open={guideOpen} onOpenChange={setGuideOpen} /> : null}
    </>
  )
}
