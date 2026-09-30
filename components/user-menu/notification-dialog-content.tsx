"use client"

import type { ReactNode } from "react"
import { BellRingIcon } from "lucide-react"

import { DateTimeFields } from "@/components/forms/date-time-fields"
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
import { type NotificationSettings } from "@/lib/notifications/types"

export { defaultNotificationSettings, type NotificationSettings } from "@/lib/notifications/types"

type NotificationDialogContentProps = {
  children?: ReactNode
  onReminderTimeCommit?: (value: string) => void
  settings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
  disabled?: boolean
  notificationsEnabled?: boolean
  onNotificationsEnabledChange?: (enabled: boolean) => void
}

export function NotificationDialogContent({
  settings,
  children,
  onReminderTimeCommit,
  onSettingsChange,
  disabled = false,
  notificationsEnabled = settings.notificationsEnabled,
  onNotificationsEnabledChange,
}: NotificationDialogContentProps) {
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

          <DateTimeFields
            idPrefix="daily-reminder"
            label="Giờ nhắc hằng ngày"
            showDate={false}
            timeValue={settings.dailyReminderTime}
            onTimeChange={(event) =>
              updateSetting("dailyReminderTime", event.target.value)
            }
            onTimeBlur={(event) => onReminderTimeCommit?.(event.currentTarget.value)}
            disabled={disabled || !notificationsEnabled}
          />
        </FieldGroup>
        {children}
      </CardContent>
    </Card>
  )
}
