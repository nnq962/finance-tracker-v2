"use client"

import * as React from "react"
import { DownloadIcon } from "lucide-react"

import { IosInstallDialog, usePwaInstall } from "@/components/pwa-install-button"
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
        color="emerald"
        title="Cài ứng dụng"
        description="Mở từ Màn hình chính như một app và nhận thông báo."
        onClick={() => (isIOS ? setGuideOpen(true) : void install())}
      />
      {isIOS ? <IosInstallDialog open={guideOpen} onOpenChange={setGuideOpen} /> : null}
    </>
  )
}
