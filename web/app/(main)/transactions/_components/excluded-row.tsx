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
  const balance = `${kind === "income" ? "cộng vào" : "trừ vào"} số dư ${accountName ?? "tài khoản"}`
  return (
    <SettingsRow
      icon={EyeOffIcon}
      tone="neutral"
      title="Không tính vào thống kê"
      description={checked ? `Vẫn ${balance}` : "Tính vào tổng thu chi và biểu đồ"}
      action={
        <>
          <Switch aria-label="Không tính vào thống kê" checked={checked} onCheckedChange={onCheckedChange} />
          {name && checked ? <input type="hidden" name={name} value="on" /> : null}
        </>
      }
    />
  )
}
