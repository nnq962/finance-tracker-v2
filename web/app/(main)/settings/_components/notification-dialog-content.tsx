"use client"

import type { ReactNode } from "react"
import { BellRingIcon, ClockIcon, SaveIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type NotificationSettings } from "@/lib/notifications/types"

export { defaultNotificationSettings, type NotificationSettings } from "@/lib/notifications/types"

type NotificationDialogContentProps = {
  children?: ReactNode
  /** Saves hour and minute together; without it no save button is shown. */
  onReminderTimeSave?: () => void
  reminderTimeChanged?: boolean
  settings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
  disabled?: boolean
  notificationsEnabled?: boolean
  onNotificationsEnabledChange?: (enabled: boolean) => void
}

export function NotificationDialogContent({
  settings,
  children,
  onReminderTimeSave,
  reminderTimeChanged = false,
  onSettingsChange,
  disabled = false,
  notificationsEnabled = settings.notificationsEnabled,
  onNotificationsEnabledChange,
}: NotificationDialogContentProps) {
  const [reminderHour, reminderMinute] = settings.dailyReminderTime.split(":")
  const reminderHours = Array.from({ length: 24 }, (_, hour) =>
    String(hour).padStart(2, "0"),
  )
  const reminderMinutes = ["00", "10", "20", "30", "40", "50"]

  const updateReminderTime = (hour: string, minute: string) => {
    onSettingsChange({ ...settings, dailyReminderTime: `${hour}:${minute}` })
  }
  const timeDisabled = disabled || !notificationsEnabled

  const updateSetting = <Key extends keyof NotificationSettings>(
    key: Key,
    value: NotificationSettings[Key],
  ) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      <SettingsGroup footer="Gửi tới mọi thiết bị đã kết nối, theo giờ Việt Nam.">
        <SettingsRow
          icon={BellRingIcon}
          color="amber"
          title="Nhắc hằng ngày"
          action={
            <Switch
              id="notifications-enabled"
              aria-label="Nhắc hằng ngày"
              checked={notificationsEnabled}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onNotificationsEnabledChange ? onNotificationsEnabledChange(checked) : updateSetting("notificationsEnabled", checked)
              }
            />
          }
        />
        <SettingsRow
          icon={ClockIcon}
          color="blue"
          title="Giờ nhắc"
          action={
            <div className="flex items-center gap-1.5">
              <Select
                value={reminderHour}
                onValueChange={(hour) => updateReminderTime(hour, reminderMinute)}
                disabled={timeDisabled}
              >
                <SelectTrigger id="daily-reminder-hour" aria-label="Giờ nhắc" className="w-18">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" showScrollButtons={false} className="max-h-[min(15rem,var(--radix-select-content-available-height))]">
                  <SelectGroup>
                    {reminderHours.map((hour) => (
                      <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span aria-hidden="true" className="font-semibold text-muted-foreground">:</span>
              <Select
                value={reminderMinute}
                onValueChange={(minute) => updateReminderTime(reminderHour, minute)}
                disabled={timeDisabled}
              >
                <SelectTrigger id="daily-reminder-minute" aria-label="Phút nhắc" className="w-18">
                  <SelectValue>{reminderMinute}</SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" showScrollButtons={false} className="max-h-[min(15rem,var(--radix-select-content-available-height))]">
                  <SelectGroup>
                    {reminderMinutes.map((minute) => (
                      <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </SettingsGroup>
      {onReminderTimeSave ? (
        <Button
          type="button"
          className="w-full"
          onClick={onReminderTimeSave}
          disabled={timeDisabled || !reminderTimeChanged}
        >
          <SaveIcon />
          Lưu giờ nhắc
        </Button>
      ) : null}
      {children}
    </div>
  )
}
