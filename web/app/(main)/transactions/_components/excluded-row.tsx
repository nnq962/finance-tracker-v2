"use client"

import { EyeOffIcon } from "lucide-react"

import { SettingsRow } from "@/components/settings-list"
import { Switch } from "@/components/ui/switch"

/**
 * Leaves a transaction out of the figures (monthly totals, charts, the
 * assistant's answers) while its account still moves, as MISA's "Không tính
 * vào báo cáo" (2026-10-11); in the form and the details alike. Income and
 * spending only.
 */
export function ExcludedRow({
  kind,
  accountName,
  checked,
  onCheckedChange,
  name,
}: {
  kind: "expense" | "income"
  accountName?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Sent with a form under this name, "on" while switched on. */
  name?: string
}) {
  // One line that stays put, saying what the switch does: a line that changed
  // with it read as two different things (2026-10-11).
  const account = accountName ?? "Tài khoản"
  return (
    <SettingsRow
      icon={EyeOffIcon}
      tone="neutral"
      title="Không tính vào thống kê"
      description={`${account} vẫn ${kind === "income" ? "được cộng" : "bị trừ"} tiền như thường`}
      action={
        <>
          <Switch aria-label="Không tính vào thống kê" checked={checked} onCheckedChange={onCheckedChange} />
          {name && checked ? <input type="hidden" name={name} value="on" /> : null}
        </>
      }
    />
  )
}
