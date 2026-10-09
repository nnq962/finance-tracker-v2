"use client"

import { useState, type ReactNode } from "react"
import { BellRingIcon, ChevronDownIcon, ClockIcon, SaveIcon } from "lucide-react"

import { Collapse } from "@/components/app/collapse"
import { WheelPicker, WheelPickerGroup } from "@/components/app/wheel-picker"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { type NotificationSettings } from "@/lib/notifications/types"
import { cn } from "@/lib/utils"

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
  const [timeOpen, setTimeOpen] = useState(false)
  // Folded while the time cannot be changed, e.g. with reminders off.
  const wheelsOpen = timeOpen && !timeDisabled

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
        {/* As TimeRows and iOS: the time on the row, the wheels unfolding under it. */}
        <SettingsRow
          icon={ClockIcon}
          title="Giờ nhắc"
          value={
            <span className="flex items-center gap-1 tabular-nums">
              {settings.dailyReminderTime}
              <ChevronDownIcon
                aria-hidden="true"
                className={cn("size-4 transition-transform motion-reduce:transition-none", wheelsOpen && "rotate-180")}
              />
            </span>
          }
          chevron={false}
          expanded={wheelsOpen}
          disabled={timeDisabled}
          onClick={() => setTimeOpen((open) => !open)}
        />
        <li>
          <Collapse open={wheelsOpen}>
            {/* The row's 16 at the sides, around the band marking the chosen time too. */}
            <div className="px-4 pb-3">
              <WheelPickerGroup>
                <WheelPicker
                  items={reminderHours}
                  value={Math.max(0, reminderHours.indexOf(reminderHour))}
                  onValueChange={(index) => updateReminderTime(reminderHours[index], reminderMinute)}
                  label="Giờ nhắc"
                />
                <span aria-hidden="true" className="relative text-xl font-medium">
                  :
                </span>
                <WheelPicker
                  items={reminderMinutes}
                  value={Math.max(0, reminderMinutes.indexOf(reminderMinute))}
                  onValueChange={(index) => updateReminderTime(reminderHour, reminderMinutes[index])}
                  label="Phút nhắc"
                />
              </WheelPickerGroup>
            </div>
          </Collapse>
        </li>
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
