import { getLocalDateTime } from "@/lib/date-time"

export const REMINDER_TIME_ZONE = "Asia/Ho_Chi_Minh"

export function getNextReminderAt(dailyReminderTime: string, now: Date): Date {
  const { date } = getLocalDateTime(now.toISOString())
  // Vietnam uses UTC+07:00 without daylight-saving time.
  const reminder = new Date(`${date}T${dailyReminderTime}:00+07:00`)

  if (reminder.getTime() < now.getTime()) {
    reminder.setUTCDate(reminder.getUTCDate() + 1)
  }

  return reminder
}
