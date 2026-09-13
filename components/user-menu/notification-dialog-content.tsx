"use client"

import { BellRingIcon, HandCoinsIcon, SaveIcon, WalletCardsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export type NotificationSettings = {
  dailyReminder: boolean
  dailyReminderTime: string
  weeklySummary: boolean
  debtDueReminder: boolean
  overdueDebtReminder: boolean
  debtReminderDays: number
  budgetWarning: boolean
  largeTransactionAlert: boolean
}

export const defaultNotificationSettings: NotificationSettings = {
  dailyReminder: true,
  dailyReminderTime: "20:00",
  weeklySummary: true,
  debtDueReminder: true,
  overdueDebtReminder: true,
  debtReminderDays: 3,
  budgetWarning: true,
  largeTransactionAlert: false,
}

type NotificationDialogContentProps = {
  settings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
  onSave: () => void
}

export function NotificationDialogContent({
  settings,
  onSettingsChange,
  onSave,
}: NotificationDialogContentProps) {
  const updateSetting = <Key extends keyof NotificationSettings>(
    key: Key,
    value: NotificationSettings[Key],
  ) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRingIcon className="size-4" />
            Nhắc nhở định kỳ
          </CardTitle>
          <CardDescription>
            Duy trì thói quen cập nhật và kiểm tra tài chính.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="daily-reminder">
                  Nhắc nhở hằng ngày
                </FieldLabel>
                <FieldDescription>
                  Nhắc bạn ghi lại các khoản thu chi trong ngày.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="daily-reminder"
                checked={settings.dailyReminder}
                onCheckedChange={(checked) =>
                  updateSetting("dailyReminder", checked)
                }
              />
            </Field>

            <Field orientation="responsive" data-disabled={!settings.dailyReminder}>
              <FieldContent>
                <FieldLabel htmlFor="daily-reminder-time">
                  Thời gian nhắc
                </FieldLabel>
                <FieldDescription>
                  Thời điểm gửi thông báo mỗi ngày.
                </FieldDescription>
              </FieldContent>
              <Input
                id="daily-reminder-time"
                type="time"
                value={settings.dailyReminderTime}
                onChange={(event) =>
                  updateSetting("dailyReminderTime", event.target.value)
                }
                disabled={!settings.dailyReminder}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="weekly-summary">Tổng kết tuần</FieldLabel>
                <FieldDescription>
                  Nhận bản tóm tắt thu chi vào cuối mỗi tuần.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="weekly-summary"
                checked={settings.weeklySummary}
                onCheckedChange={(checked) =>
                  updateSetting("weeklySummary", checked)
                }
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoinsIcon className="size-4" />
            Nợ và cho vay
          </CardTitle>
          <CardDescription>
            Theo dõi các khoản nợ trước và sau ngày đến hạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="debt-due-reminder">
                  Nhắc khoản nợ sắp đến hạn
                </FieldLabel>
                <FieldDescription>
                  Thông báo trước khi khoản nợ đến hạn thanh toán.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="debt-due-reminder"
                checked={settings.debtDueReminder}
                onCheckedChange={(checked) =>
                  updateSetting("debtDueReminder", checked)
                }
              />
            </Field>

            <Field
              orientation="responsive"
              data-disabled={!settings.debtDueReminder}
            >
              <FieldContent>
                <FieldLabel htmlFor="debt-reminder-days">
                  Nhắc trước
                </FieldLabel>
                <FieldDescription>
                  Số ngày gửi thông báo trước hạn.
                </FieldDescription>
              </FieldContent>
              <Select
                value={String(settings.debtReminderDays)}
                onValueChange={(value) =>
                  updateSetting("debtReminderDays", Number(value))
                }
                disabled={!settings.debtDueReminder}
              >
                <SelectTrigger id="debt-reminder-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ngày</SelectItem>
                  <SelectItem value="3">3 ngày</SelectItem>
                  <SelectItem value="7">7 ngày</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="overdue-debt-reminder">
                  Nhắc khoản nợ quá hạn
                </FieldLabel>
                <FieldDescription>
                  Tiếp tục nhắc khi khoản nợ chưa được thanh toán đúng hạn.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="overdue-debt-reminder"
                checked={settings.overdueDebtReminder}
                onCheckedChange={(checked) =>
                  updateSetting("overdueDebtReminder", checked)
                }
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletCardsIcon className="size-4" />
            Chi tiêu và ngân sách
          </CardTitle>
          <CardDescription>
            Cảnh báo khi hoạt động tài chính cần bạn chú ý.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="budget-warning">
                  Cảnh báo ngân sách
                </FieldLabel>
                <FieldDescription>
                  Thông báo khi chi tiêu đạt 80% ngân sách tháng.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="budget-warning"
                checked={settings.budgetWarning}
                onCheckedChange={(checked) =>
                  updateSetting("budgetWarning", checked)
                }
              />
            </Field>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="large-transaction-alert">
                  Giao dịch giá trị lớn
                </FieldLabel>
                <FieldDescription>
                  Cảnh báo khi xuất hiện giao dịch từ 5.000.000đ.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="large-transaction-alert"
                checked={settings.largeTransactionAlert}
                onCheckedChange={(checked) =>
                  updateSetting("largeTransactionAlert", checked)
                }
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit">
            <SaveIcon />
            Lưu cài đặt
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
