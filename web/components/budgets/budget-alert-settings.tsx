"use client"

import * as React from "react"
import { BellRingIcon, GaugeIcon } from "lucide-react"
import { toast } from "sonner"

import { IconTile } from "@/components/app/icon-tile"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Switch } from "@/components/ui/switch"
import { saveBudgetAlertSettingsAction } from "@/lib/budgets/actions"
import { budgetPushMessage } from "@/lib/budgets/push-message"
import type { BudgetAlertSettings } from "@/lib/budgets/types"

/** The settings in a few words, for the rows that open them: "Bật · 80%", "Bật · khi vượt", "Tắt". */
export function budgetAlertsSummary(settings: BudgetAlertSettings) {
  if (!settings.enabled) return "Tắt"
  return settings.level ? `Bật · ${settings.level}%` : "Bật · khi vượt"
}

const levels = [
  { value: 80, label: "Khi dùng 80%" },
  { value: 90, label: "Khi dùng 90%" },
  { value: null, label: "Không báo trước" },
] as const

/**
 * "Thông báo hạn mức" (2026-10-17), from Cài đặt › Thông báo and the end of
 * the limits sheet: a switch for limit pushes; while on, the early warning
 * (80%, 90%, none; past the limit always) as a pick list, and the pushes it
 * would send, as an example on a limit of `example`. Each change saves at
 * once and goes back if it fails.
 */
export function BudgetAlertSettingsScreen({
  initial,
  example = { name: "Ăn uống", limit: 3_000_000 },
  onChange,
}: {
  initial: BudgetAlertSettings
  /** A limit of the user's to word the example with. */
  example?: { name: string; limit: number }
  onChange?: (settings: BudgetAlertSettings) => void
}) {
  const [settings, setSettings] = React.useState(initial)
  const save = (next: BudgetAlertSettings) => {
    const before = settings
    setSettings(next)
    onChange?.(next)
    void saveBudgetAlertSettingsAction(next)
      .then((result) => {
        if (result.success) return
        setSettings(before)
        onChange?.(before)
        toast.error(result.error)
      })
      .catch(() => {
        setSettings(before)
        onChange?.(before)
        toast.error("Không thể lưu cài đặt. Vui lòng thử lại.")
      })
  }

  const days = 15
  const early = settings.level
  const near = early
    ? budgetPushMessage(example.name, { spent: Math.round((example.limit * early) / 100), limit: example.limit }, early, days)
    : null
  const over = budgetPushMessage(example.name, { spent: Math.round(example.limit * 1.05), limit: example.limit }, 100, days)

  return (
    <div className="flex flex-col gap-6">
      <SettingsGroup footer="Báo trên các thiết bị đã bật thông báo.">
        <SettingsRow
          icon={GaugeIcon}
          title="Báo khi chạm hạn mức"
          action={
            <Switch
              aria-label="Báo khi chạm hạn mức"
              checked={settings.enabled}
              onCheckedChange={(enabled) => save({ ...settings, enabled })}
            />
          }
        />
      </SettingsGroup>
      {settings.enabled ? (
        <>
          <SettingsGroup title="Báo trước" footer="Luôn báo khi vượt hạn mức. Mỗi hạn mức báo mỗi mốc một lần trong tháng.">
            {levels.map((option) => (
              <SettingsRow
                key={option.label}
                title={option.label}
                checked={settings.level === option.value}
                onClick={() => save({ ...settings, level: option.value })}
              />
            ))}
          </SettingsGroup>
          <SettingsGroup title="Ví dụ">
            {[near, over].flatMap((message) =>
              message
                ? [
                    <SettingsRow
                      key={message.title}
                      media={<IconTile icon={BellRingIcon} size="sm" />}
                      title={message.title}
                      description={message.body}
                      fullDescription
                    />,
                  ]
                : [],
            )}
          </SettingsGroup>
        </>
      ) : (
        <p className="px-4 text-sm text-muted-foreground">
          Không báo gì về hạn mức. Vẫn xem được trong sheet Hạn mức và dòng cảnh báo khi ghi khoản chi.
        </p>
      )}
    </div>
  )
}
