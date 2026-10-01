import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { FieldValue, Timestamp, type Transaction } from "firebase-admin/firestore"
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin"
import { defaultNotificationSettings, type NotificationSettings, type NotificationState } from "./types"
import { assertFid, NotificationValidationError, parseNotificationSettings, validPushCookie } from "./validation"
import { getNextReminderAt, REMINDER_TIME_ZONE } from "./schedule"

type BrowserSession = { uid: string | null; sessionId: string; deviceId: string | null }
export type PushContext = { browserId: string; sessionId: string }

const db = () => getFirebaseAdminFirestore()
const browserRef = (id: string) => db().collection("notificationBrowsers").doc(id)
const ownerRef = (id: string) => db().collection("pushInstallations").doc(id)
const devicesRef = (uid: string) => db().collection("users").doc(uid).collection("pushDevices")
const settingsRef = (uid: string) => db().collection("users").doc(uid).collection("notificationSettings").doc("default")
const deviceIdFor = (fid: string) => createHash("sha256").update(fid).digest("hex")

function assertBrowser(data: BrowserSession | undefined, uid: string, context: PushContext) {
  if (!data || data.uid !== uid || data.sessionId !== context.sessionId) {
    throw new NotificationValidationError("Phiên thiết bị đã thay đổi. Tải lại trang và đăng ký lại.")
  }
}

async function unlink(tx: Transaction, browserId: string, data: BrowserSession) {
  if (!data.deviceId || !data.uid) return
  const owner = await tx.get(ownerRef(data.deviceId))
  if (owner.data()?.browserId === browserId && owner.data()?.uid === data.uid) {
    tx.delete(owner.ref)
    tx.delete(devicesRef(data.uid).doc(data.deviceId))
  }
}

// A server-issued browser identity plus a rotating session prevents late registration
// requests from reattaching a device after logout or an account switch.
export async function openPushSession(uid: string, oldBrowserId?: string, oldSessionId?: string): Promise<PushContext> {
  const browserId = validPushCookie(oldBrowserId) ? oldBrowserId : randomUUID()
  return db().runTransaction(async (tx) => {
    const ref = browserRef(browserId)
    const snapshot = await tx.get(ref)
    const data = snapshot.data() as BrowserSession | undefined
    if (data?.uid === uid && data.sessionId === oldSessionId) return { browserId, sessionId: data.sessionId }
    if (data) await unlink(tx, browserId, data)
    const sessionId = randomUUID()
    tx.set(ref, { uid, sessionId, deviceId: null, updatedAt: Timestamp.now() })
    return { browserId, sessionId }
  })
}

export async function closePushSession(browserId?: string, sessionId?: string) {
  if (!validPushCookie(browserId) || !validPushCookie(sessionId)) return
  await db().runTransaction(async (tx) => {
    const ref = browserRef(browserId)
    const snapshot = await tx.get(ref)
    const data = snapshot.data() as BrowserSession | undefined
    if (!data || data.sessionId !== sessionId) return
    await unlink(tx, browserId, data)
    tx.set(ref, { uid: null, sessionId: randomUUID(), deviceId: null, updatedAt: Timestamp.now() })
  })
}

export async function getNotificationSettings(uid: string): Promise<NotificationSettings> {
  const snapshot = await settingsRef(uid).get()
  return snapshot.exists ? parseNotificationSettings(snapshot.data()) : { ...defaultNotificationSettings }
}

export async function saveNotificationSettings(uid: string, input: unknown) {
  const settings = { ...parseNotificationSettings(input), timeZone: REMINDER_TIME_ZONE }
  const ref = settingsRef(uid)
  await db().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref)
    const previous = snapshot.data()
    const now = Timestamp.now()
    const scheduleChanged = !previous?.notificationsEnabled ||
      previous.dailyReminderTime !== settings.dailyReminderTime ||
      previous.timeZone !== REMINDER_TIME_ZONE ||
      !(previous.nextReminderAt instanceof Timestamp)

    tx.set(ref, {
      ...settings,
      updatedAt: now,
      ...(!settings.notificationsEnabled
        ? { nextReminderAt: FieldValue.delete() }
        : scheduleChanged
          ? { nextReminderAt: Timestamp.fromDate(getNextReminderAt(settings.dailyReminderTime, now.toDate())) }
          : {}),
    }, { merge: true })
  })
  return settings
}

export async function getNotificationState(uid: string, context?: PushContext): Promise<NotificationState> {
  const [settings, devices, browser] = await Promise.all([
    getNotificationSettings(uid), devicesRef(uid).get(),
    context ? browserRef(context.browserId).get() : Promise.resolve(null),
  ])
  const data = browser?.data() as BrowserSession | undefined
  return {
    settings,
    devices: devices.docs.map((doc) => ({
      id: doc.id, name: doc.data().name,
      updatedAt: doc.data().updatedAt.toDate().toISOString(),
    })),
    currentDeviceId: data?.uid === uid && data.sessionId === context?.sessionId ? data.deviceId : null,
  }
}

export async function registerPushDevice(uid: string, context: PushContext, fid: unknown, name: unknown) {
  assertFid(fid)
  if (typeof name !== "string" || !name.trim() || name.length > 100) throw new NotificationValidationError("Tên thiết bị không hợp lệ.")
  const id = deviceIdFor(fid)
  await db().runTransaction(async (tx) => {
    const ref = browserRef(context.browserId)
    const [browser, owner, device] = await Promise.all([
      tx.get(ref), tx.get(ownerRef(id)), tx.get(devicesRef(uid).doc(id)),
    ])
    const data = browser.data() as BrowserSession | undefined
    assertBrowser(data, uid, context)
    const previous = owner.data() as { uid: string; browserId: string } | undefined
    // Complete all reads before mutations (Firestore transaction requirement).
    const previousBrowser = previous && previous.browserId !== context.browserId
      ? await tx.get(browserRef(previous.browserId)) : null
    if (data!.deviceId && data!.deviceId !== id) await unlink(tx, context.browserId, data!)
    if (previous && previous.uid !== uid) tx.delete(devicesRef(previous.uid).doc(id))
    if (previousBrowser?.data()?.deviceId === id) tx.update(previousBrowser.ref, { deviceId: null })
    const now = Timestamp.now()
    tx.set(devicesRef(uid).doc(id), {
      fid, name: name.trim(), browserId: context.browserId,
      createdAt: device.data()?.createdAt ?? now, updatedAt: now,
    })
    tx.set(ownerRef(id), { uid, browserId: context.browserId })
    tx.update(ref, { deviceId: id, updatedAt: now })
  })
  return id
}

export async function detachPushDevice(uid: string, context: PushContext) {
  await db().runTransaction(async (tx) => {
    const ref = browserRef(context.browserId)
    const snapshot = await tx.get(ref)
    const data = snapshot.data() as BrowserSession | undefined
    assertBrowser(data, uid, context)
    await unlink(tx, context.browserId, data!)
    tx.update(ref, { deviceId: null, updatedAt: Timestamp.now() })
  })
}

export async function getCurrentPushFid(uid: string, context: PushContext) {
  const browser = await browserRef(context.browserId).get()
  const data = browser.data() as BrowserSession | undefined
  assertBrowser(data, uid, context)
  if (!data!.deviceId) throw new NotificationValidationError("Thiết bị này chưa được đăng ký.")
  const [owner, device] = await Promise.all([
    ownerRef(data!.deviceId).get(), devicesRef(uid).doc(data!.deviceId).get(),
  ])
  if (owner.data()?.uid !== uid || owner.data()?.browserId !== context.browserId || !device.exists) {
    throw new NotificationValidationError("Thiết bị không còn liên kết với tài khoản này.")
  }
  return device.data()!.fid as string
}
