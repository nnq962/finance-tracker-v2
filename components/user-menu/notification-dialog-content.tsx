"use client"

import { BellRingIcon } from "lucide-react"

import { DateTimeFields } from "@/components/forms/date-time-fields"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export type NotificationSettings = {
  notificationsEnabled: boolean
  dailyReminderTime: string
}

export const defaultNotificationSettings: NotificationSettings = {
  notificationsEnabled: true,
  dailyReminderTime: "20:00",
}

type NotificationDialogContentProps = {
  settings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
}

export function NotificationDialogContent({
  settings,
  onSettingsChange,
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
          Nhắc nhở hằng ngày
        </CardTitle>
        <CardDescription>
          Nhắc bạn cập nhật các khoản thu chi vào thời gian phù hợp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="notifications-enabled">
                Bật thông báo
              </FieldLabel>
              <FieldDescription>
                Nhận một lời nhắc ghi chép tài chính mỗi ngày.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="notifications-enabled"
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) =>
                updateSetting("notificationsEnabled", checked)
              }
            />
          </Field>

          <DateTimeFields
            idPrefix="daily-reminder"
            label="Giờ nhắc hằng ngày"
            description="Thời điểm gửi thông báo mỗi ngày."
            showDate={false}
            timeValue={settings.dailyReminderTime}
            onTimeChange={(event) =>
              updateSetting("dailyReminderTime", event.target.value)
            }
            disabled={!settings.notificationsEnabled}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
