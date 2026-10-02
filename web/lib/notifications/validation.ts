import type { NotificationSettings } from "./types"

export class NotificationValidationError extends Error {}

export function parseNotificationSettings(input: unknown): NotificationSettings {
  if (typeof input !== "object" || input === null) throw new NotificationValidationError("Cài đặt không hợp lệ.")
  const value = input as Record<string, unknown>
  if (typeof value.notificationsEnabled !== "boolean" ||
      typeof value.dailyReminderTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.dailyReminderTime) ||
      typeof value.timeZone !== "string" || !value.timeZone.length || value.timeZone.length > 80) {
    throw new NotificationValidationError("Kiểm tra giờ nhắc và múi giờ.")
  }
  try { new Intl.DateTimeFormat("vi-VN", { timeZone: value.timeZone }) }
  catch { throw new NotificationValidationError("Múi giờ không hợp lệ. Dùng tên như Asia/Ho_Chi_Minh.") }
  return {
    notificationsEnabled: value.notificationsEnabled,
    dailyReminderTime: value.dailyReminderTime,
    timeZone: value.timeZone,
  }
}

export function assertFid(fid: unknown): asserts fid is string {
  if (typeof fid !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(fid)) {
    throw new NotificationValidationError("Đăng ký thiết bị chưa hợp lệ.")
  }
}

export function validPushCookie(value: string | undefined): value is string {
  return !!value && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)
}
