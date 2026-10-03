"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { getPushContext } from "./context"
import { sendWelcomePush } from "./push"
import { detachPushDevice, getNotificationState, registerPushDevice, saveNotificationSettings } from "./repository"
import { NotificationValidationError } from "./validation"

async function mutate<T>(expectedUid: string, operation: (uid: string) => Promise<T>) {
  const user = await requireSession()
  try {
    if (user.uid !== expectedUid) throw new NotificationValidationError("Tài khoản đã thay đổi. Tải lại trang rồi thử lại.")
    return { success: true as const, data: await operation(user.uid) }
  }
  catch (error) {
    if (!(error instanceof NotificationValidationError)) console.error("Notification operation failed", error)
    return { success: false as const, error: error instanceof NotificationValidationError
      ? error.message : "Không thể lưu thông báo. Kiểm tra mạng rồi thử lại." }
  }
}

export async function getNotificationStateAction(expectedUid: string) {
  return mutate(expectedUid, async (uid) => getNotificationState(uid, await getPushContext()))
}

export async function saveNotificationSettingsAction(input: unknown, expectedUid: string) {
  const result = await mutate(expectedUid, (uid) => saveNotificationSettings(uid, input))
  // The missions on the overview tick off the reminder.
  if (result.success) revalidatePath("/overview")
  return result
}

/** `welcome` is set when the user turns notifications on themselves, not on a background refresh. */
export async function registerPushDeviceAction(fid: unknown, name: unknown, expectedUid: string, welcome = false) {
  return mutate(expectedUid, async (uid) => {
    const { id, isNew } = await registerPushDevice(uid, await getPushContext(), fid, name)
    // Only a device just linked to this account is greeted, once.
    if (welcome && isNew) await sendWelcomePush(fid as string)
    return id
  })
}

export async function detachPushDeviceAction(expectedUid: string) {
  return mutate(expectedUid, async (uid) => detachPushDevice(uid, await getPushContext()))
}
