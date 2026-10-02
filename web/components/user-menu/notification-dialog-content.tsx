"use client"

import type { ReactNode } from "react"
import { BellRingIcon, SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRingIcon className="size-4" />
          Thông báo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="notifications-enabled">
              Bật thông báo
            </FieldLabel>
            <Switch
              id="notifications-enabled"
              checked={notificationsEnabled}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onNotificationsEnabledChange ? onNotificationsEnabledChange(checked) : updateSetting("notificationsEnabled", checked)
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="daily-reminder-hour">
              Giờ nhắc hằng ngày
            </FieldLabel>
            <div
              className={
                onReminderTimeSave
                  ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3"
                  : "grid grid-cols-2 gap-4"
              }
            >
              <Select
                value={reminderHour}
                onValueChange={(hour) => updateReminderTime(hour, reminderMinute)}
                disabled={timeDisabled}
              >
                <SelectTrigger id="daily-reminder-hour" aria-label="Giờ nhắc" className="w-full">
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
              <Select
                value={reminderMinute}
                onValueChange={(minute) => updateReminderTime(reminderHour, minute)}
                disabled={timeDisabled}
              >
                <SelectTrigger id="daily-reminder-minute" aria-label="Phút nhắc" className="w-full">
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
              {onReminderTimeSave ? (
                <Button
                  type="button"
                  onClick={onReminderTimeSave}
                  disabled={timeDisabled || !reminderTimeChanged}
                >
                  <SaveIcon />
                  Lưu
                </Button>
              ) : null}
            </div>
          </Field>
        </FieldGroup>
        {children}
      </CardContent>
    </Card>
  )
}
