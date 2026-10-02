"use client"

import { firebaseApp, firebaseAuth } from "./client"
import { registerFcmDevice } from "./messaging"
import { detachPushDeviceAction, getNotificationStateAction, registerPushDeviceAction } from "@/lib/notifications/actions"

export const PUSH_DEVICE_CHANGED = "finance-push-device-changed"
let generation = 0
let currentUid: string | null = null
let registering = 0
let removeObservers: (() => void) | undefined
let syncing: Promise<void> | undefined

export function notifyPushDeviceChanged() {
  window.dispatchEvent(new Event(PUSH_DEVICE_CHANGED))
}

function deviceName() {
  const ua = navigator.userAgent
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android"
    : /Mac/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : "Thiết bị"
  const app = window.matchMedia("(display-mode: standalone)").matches ? "PWA"
    : /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Trình duyệt"
  return `${os} · ${app}`
}

function stillCurrent(uid: string, version: number) {
  return generation === version && firebaseAuth.currentUser?.uid === uid
}

async function persist(fid: string, uid: string, version: number) {
  if (!stillCurrent(uid, version)) throw new Error("Tài khoản đã thay đổi. Đăng ký thiết bị lại.")
  const result = await registerPushDeviceAction(fid, deviceName(), uid)
  if (!result.success) throw new Error(result.error)
  if (!stillCurrent(uid, version)) throw new Error("Phiên đăng ký đã kết thúc.")
  notifyPushDeviceChanged()
  return result.data
}

export function stopPushDeviceSync() {
  generation++
  currentUid = null
  removeObservers?.()
  removeObservers = undefined
  syncing = undefined
}

export async function unregisterLocalPushDevice() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return
  const { getMessaging, isSupported, unregister } = await import("firebase/messaging")
  if (await isSupported()) await unregister(getMessaging(firebaseApp))
}

export async function registerAccountPushDevice(uid: string) {
  if (currentUid !== uid) {
    stopPushDeviceSync()
    currentUid = uid
  }
  const version = generation
  registering++
  try {
    // This call must remain directly in the button event to retain the permission gesture.
    const fid = await registerFcmDevice()
    return await persist(fid, uid, version)
  } finally { registering-- }
}

export async function syncAccountPushDevice(uid: string) {
  if (firebaseAuth.currentUser?.uid !== uid) return
  if (currentUid !== uid) {
    stopPushDeviceSync()
    currentUid = uid
  }
  if (syncing) return syncing
  const version = generation
  const work = (async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return
    const { getMessaging, isSupported, onRegistered, onUnregistered } = await import("firebase/messaging")
    if (!(await isSupported()) || !stillCurrent(uid, version)) return
    const messaging = getMessaging(firebaseApp)
    if (!removeObservers) {
      const stopRegistered = onRegistered(messaging, (fid) => {
        if (!registering && stillCurrent(uid, version)) {
          void persist(fid, uid, version).catch((error) => console.warn("Không thể cập nhật thiết bị push", error))
        }
      })
      const stopUnregistered = onUnregistered(messaging, () => {
        if (stillCurrent(uid, version)) {
          void detachPushDeviceAction(uid).then((result) => {
            if (result.success && stillCurrent(uid, version)) notifyPushDeviceChanged()
          }).catch((error) => console.warn("Không thể gỡ thiết bị push", error))
        }
      })
      removeObservers = () => { stopRegistered(); stopUnregistered() }
    }
    const state = await getNotificationStateAction(uid)
    if (!stillCurrent(uid, version)) return
    if (!state.success) throw new Error(state.error)
    if (Notification.permission !== "granted") {
      if (state.data.currentDeviceId) {
        await detachPushDeviceAction(uid)
        notifyPushDeviceChanged()
      }
      return
    }
    if (!state.data.settings.notificationsEnabled && !state.data.currentDeviceId) return
    registering++
    try {
      const fid = await registerFcmDevice(false)
      await persist(fid, uid, version)
    } finally { registering-- }
  })()
  syncing = work
  try { await work } finally { if (syncing === work) syncing = undefined }
}
