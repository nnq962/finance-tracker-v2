"use client"

import * as React from "react"
import { DownloadIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import type { UserDataSummary } from "@/lib/user-data/repository"

import { DeleteAccountSheet } from "./delete-account"
import { ExportDataSheet } from "./export-data"
import { WipeDataSheet } from "./wipe-data"

/**
 * Cài đặt › Dữ liệu (2026-10-20): the user's own data, out (export) or gone
 * (wipe the data, delete the whole account), each behind its sheet.
 */
export function DataGroup({ summary, email, proEndsAt }: { summary: UserDataSummary; email?: string; proEndsAt: string | null }) {
  const [sheet, setSheet] = React.useState<"export" | "wipe" | "delete" | null>(null)
  const close = (open: boolean) => {
    if (!open) setSheet(null)
  }

  return (
    <>
      <SettingsGroup title="Dữ liệu" footer="Xuất ra Excel hoặc CSV để giữ bản riêng. Xoá dữ liệu giữ lại đăng nhập và gói Pro; xoá tài khoản xoá cả hai.">
        <SettingsRow icon={DownloadIcon} title="Xuất dữ liệu" onClick={() => setSheet("export")} />
        <SettingsRow destructive title="Xoá toàn bộ dữ liệu" onClick={() => setSheet("wipe")} />
        <SettingsRow destructive title="Xoá tài khoản" onClick={() => setSheet("delete")} />
      </SettingsGroup>
      <ExportDataSheet summary={summary} open={sheet === "export"} onOpenChange={close} />
      <WipeDataSheet summary={summary} open={sheet === "wipe"} onOpenChange={close} />
      <DeleteAccountSheet email={email} proEndsAt={proEndsAt} open={sheet === "delete"} onOpenChange={close} />
    </>
  )
}
