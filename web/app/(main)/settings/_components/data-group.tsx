"use client"

import * as React from "react"
import { FileDownIcon } from "lucide-react"

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
      {/* The export as a normal row, the two red centred actions in a card of
          their own under it (2026-10-20): mixing the two kinds in one card
          read badly. */}
      <SettingsGroup title="Dữ liệu" footer="Excel hoặc CSV, tải thẳng về máy bạn.">
        <SettingsRow icon={FileDownIcon} title="Xuất dữ liệu" onClick={() => setSheet("export")} />
      </SettingsGroup>
      <SettingsGroup footer="Xoá dữ liệu giữ lại đăng nhập và gói Pro; xoá tài khoản xoá cả hai.">
        <SettingsRow destructive title="Xoá toàn bộ dữ liệu" onClick={() => setSheet("wipe")} />
        <SettingsRow destructive title="Xoá tài khoản" onClick={() => setSheet("delete")} />
      </SettingsGroup>
      <ExportDataSheet summary={summary} open={sheet === "export"} onOpenChange={close} />
      <WipeDataSheet summary={summary} open={sheet === "wipe"} onOpenChange={close} />
      <DeleteAccountSheet email={email} proEndsAt={proEndsAt} open={sheet === "delete"} onOpenChange={close} />
    </>
  )
}
