export type NotificationSettings = {
  notificationsEnabled: boolean
  dailyReminderTime: string
  timeZone: string
}

export const defaultNotificationSettings: NotificationSettings = {
  notificationsEnabled: false,
  dailyReminderTime: "20:00",
  timeZone: "Asia/Ho_Chi_Minh",
}

export type PushDevice = {
  id: string
  name: string
  updatedAt: string
}

export type NotificationState = {
  settings: NotificationSettings
  devices: PushDevice[]
  currentDeviceId: string | null
}

export const PUSH_BROWSER_COOKIE = "__push_browser"
export const PUSH_SESSION_COOKIE = "__push_session"
