import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { sql, type Transaction } from "kysely"

import { getDb } from "@/lib/db/client"
import type { DB } from "@/lib/db/types"
import { defaultNotificationSettings, type NotificationSettings, type NotificationState } from "./types"
import { assertFid, NotificationValidationError, parseNotificationSettings, validPushCookie } from "./validation"
import { getNextReminderAt, REMINDER_TIME_ZONE } from "./schedule"

type Trx = Transaction<DB>
type BrowserSession = { userId: string | null; sessionId: string; deviceId: string | null }
export type PushContext = { browserId: string; sessionId: string }

const deviceIdFor = (fid: string) => createHash("sha256").update(fid).digest("hex")
// time columns read as "HH:MM:SS"; the app works in "HH:MM".
const toMinutes = (time: string) => time.slice(0, 5)

function lockBrowser(trx: Trx, browserId: string) {
  return trx
    .selectFrom("notificationBrowsers")
    .select(["userId", "sessionId", "deviceId"])
    .where("id", "=", browserId)
    .forUpdate()
    .executeTakeFirst()
}

function assertBrowser(data: BrowserSession | undefined, uid: string, context: PushContext) {
  if (!data || data.userId !== uid || data.sessionId !== context.sessionId) {
    throw new NotificationValidationError("Phiên thiết bị đã thay đổi. Tải lại trang và đăng ký lại.")
  }
}

/** Removes the browser's device if it still belongs to that browser and user. */
async function unlink(trx: Trx, browserId: string, data: BrowserSession) {
  if (!data.deviceId || !data.userId) return
  // The browser's device_id is cleared by its foreign key.
  await trx
    .deleteFrom("pushDevices")
    .where("id", "=", data.deviceId)
    .where("browserId", "=", browserId)
    .where("userId", "=", data.userId)
    .execute()
}

// A server-issued browser identity plus a rotating session prevents late registration
// requests from reattaching a device after logout or an account switch.
export async function openPushSession(uid: string, oldBrowserId?: string, oldSessionId?: string): Promise<PushContext> {
  const browserId = validPushCookie(oldBrowserId) ? oldBrowserId : randomUUID()
  return getDb().transaction().execute(async (trx) => {
    const data = await lockBrowser(trx, browserId)
    if (data?.userId === uid && data.sessionId === oldSessionId) return { browserId, sessionId: data.sessionId }
    if (data) await unlink(trx, browserId, data)
    const sessionId = randomUUID()
    await trx
      .insertInto("notificationBrowsers")
      .values({ id: browserId, userId: uid, sessionId, deviceId: null })
      // updated_at marks the latest sign-in: the worker removes rows without a
      // device only once they are far older than any session.
      .onConflict((conflict) => conflict.column("id").doUpdateSet({ userId: uid, sessionId, deviceId: null, updatedAt: sql`now()` }))
      .execute()
    return { browserId, sessionId }
  })
}

export async function closePushSession(browserId?: string, sessionId?: string) {
  if (!validPushCookie(browserId) || !validPushCookie(sessionId)) return
  await getDb().transaction().execute(async (trx) => {
    const data = await lockBrowser(trx, browserId)
    if (!data || data.sessionId !== sessionId) return
    await unlink(trx, browserId, data)
    await trx
      .updateTable("notificationBrowsers")
      .set({ userId: null, sessionId: randomUUID(), deviceId: null, updatedAt: sql`now()` })
      .where("id", "=", browserId)
      .execute()
  })
}

export async function getNotificationSettings(uid: string): Promise<NotificationSettings> {
  const row = await getDb()
    .selectFrom("notificationSettings")
    .select(["notificationsEnabled", "dailyReminderTime", "timeZone"])
    .where("userId", "=", uid)
    .executeTakeFirst()
  return row
    ? parseNotificationSettings({ ...row, dailyReminderTime: toMinutes(row.dailyReminderTime) })
    : { ...defaultNotificationSettings }
}

export async function saveNotificationSettings(uid: string, input: unknown) {
  const settings = { ...parseNotificationSettings(input), timeZone: REMINDER_TIME_ZONE }
  await getDb().transaction().execute(async (trx) => {
    const previous = await trx
      .selectFrom("notificationSettings")
      .select(["notificationsEnabled", "dailyReminderTime", "timeZone", "nextReminderAt"])
      .where("userId", "=", uid)
      .forUpdate()
      .executeTakeFirst()
    const scheduleChanged = !previous?.notificationsEnabled ||
      toMinutes(previous.dailyReminderTime) !== settings.dailyReminderTime ||
      previous.timeZone !== REMINDER_TIME_ZONE ||
      !previous.nextReminderAt
    // Saving the same settings again keeps the pending reminder.
    const nextReminderAt = !settings.notificationsEnabled
      ? null
      : scheduleChanged
        ? getNextReminderAt(settings.dailyReminderTime, new Date())
        : previous!.nextReminderAt
    const columns = { ...settings, nextReminderAt }

    await trx
      .insertInto("notificationSettings")
      .values({ userId: uid, ...columns })
      .onConflict((conflict) => conflict.column("userId").doUpdateSet(columns))
      .execute()
  })
  return settings
}

export async function getNotificationState(uid: string, context?: PushContext): Promise<NotificationState> {
  const db = getDb()
  const [settings, devices, browser] = await Promise.all([
    getNotificationSettings(uid),
    db.selectFrom("pushDevices").select(["id", "name", "updatedAt"]).where("userId", "=", uid).orderBy("createdAt").execute(),
    context
      ? db.selectFrom("notificationBrowsers").select(["userId", "sessionId", "deviceId"]).where("id", "=", context.browserId).executeTakeFirst()
      : undefined,
  ])
  return {
    settings,
    devices: devices.map((device) => ({ id: device.id, name: device.name, updatedAt: device.updatedAt.toISOString() })),
    currentDeviceId: browser?.userId === uid && browser.sessionId === context?.sessionId ? browser.deviceId : null,
  }
}

export async function registerPushDevice(uid: string, context: PushContext, fid: unknown, name: unknown) {
  assertFid(fid)
  if (typeof name !== "string" || !name.trim() || name.length > 100) throw new NotificationValidationError("Tên thiết bị không hợp lệ.")
  const id = deviceIdFor(fid)
  await getDb().transaction().execute(async (trx) => {
    const data = await lockBrowser(trx, context.browserId)
    assertBrowser(data, uid, context)
    if (data!.deviceId && data!.deviceId !== id) await unlink(trx, context.browserId, data!)
    // One FCM registration has one owner: take it over from any other browser or user.
    await trx
      .updateTable("notificationBrowsers")
      .set({ deviceId: null })
      .where("deviceId", "=", id)
      .where("id", "!=", context.browserId)
      .execute()
    const device = { userId: uid, fid, name: name.trim(), browserId: context.browserId }
    await trx
      .insertInto("pushDevices")
      .values({ id, ...device })
      .onConflict((conflict) => conflict.column("id").doUpdateSet(device))
      .execute()
    await trx.updateTable("notificationBrowsers").set({ deviceId: id }).where("id", "=", context.browserId).execute()
  })
  return id
}

export async function detachPushDevice(uid: string, context: PushContext) {
  await getDb().transaction().execute(async (trx) => {
    const data = await lockBrowser(trx, context.browserId)
    assertBrowser(data, uid, context)
    await unlink(trx, context.browserId, data!)
    await trx.updateTable("notificationBrowsers").set({ deviceId: null }).where("id", "=", context.browserId).execute()
  })
}

export async function getCurrentPushFid(uid: string, context: PushContext) {
  const db = getDb()
  const data = await db
    .selectFrom("notificationBrowsers")
    .select(["userId", "sessionId", "deviceId"])
    .where("id", "=", context.browserId)
    .executeTakeFirst()
  assertBrowser(data, uid, context)
  if (!data!.deviceId) throw new NotificationValidationError("Thiết bị này chưa được đăng ký.")
  const device = await db
    .selectFrom("pushDevices")
    .select(["fid", "userId", "browserId"])
    .where("id", "=", data!.deviceId)
    .executeTakeFirst()
  if (!device || device.userId !== uid || device.browserId !== context.browserId) {
    throw new NotificationValidationError("Thiết bị không còn liên kết với tài khoản này.")
  }
  return device.fid
}
