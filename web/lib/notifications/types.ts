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

/**
 * Timi's look on a notification: the icon beside it, and the one-colour
 * badge Android shows in the status bar (only its shape is used). Paths on
 * this site, which the service worker shows them from.
 */
export const PUSH_ICONS = { icon: "/icons/pwa-192.png", badge: "/icons/badge-96.png" } as const
