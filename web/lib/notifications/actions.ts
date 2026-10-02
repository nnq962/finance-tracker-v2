"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { getPushContext } from "./context"
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
  // The overview's getting-started card ticks off the reminder step.
  if (result.success) revalidatePath("/overview")
  return result
}

export async function registerPushDeviceAction(fid: unknown, name: unknown, expectedUid: string) {
  return mutate(expectedUid, async (uid) => {
    return registerPushDevice(uid, await getPushContext(), fid, name)
  })
}

export async function detachPushDeviceAction(expectedUid: string) {
  return mutate(expectedUid, async (uid) => detachPushDevice(uid, await getPushContext()))
}
