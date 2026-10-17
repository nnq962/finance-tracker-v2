"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { requireAdmin } from "@/lib/plans/admin"

import {
  BroadcastError,
  createBroadcast,
  getBroadcastScreenData,
  revokeBroadcast,
  sendTestBroadcast,
  setBroadcastsEnabled,
} from "./repository"
import type { BroadcastScreenData } from "./types"

type Result<T = undefined> = { success: true; data: T } | { success: false; error: string }

async function attempt<T>(operation: () => Promise<T>, fallback: string): Promise<Result<T>> {
  try {
    return { success: true, data: await operation() }
  } catch (error) {
    if (!(error instanceof BroadcastError)) console.error("Broadcast action failed", error)
    return { success: false, error: error instanceof BroadcastError ? error.message : fallback }
  }
}

/** The history and each audience's reach, as they stand now. Admins only. */
export async function getBroadcastScreenAction(): Promise<Result<BroadcastScreenData>> {
  await requireAdmin()
  return attempt(getBroadcastScreenData, "Không tải được thông báo đã gửi.")
}

/** Sends a broadcast now or sets it for later. Admins only. */
export async function createBroadcastAction(input: unknown): Promise<Result<string>> {
  const admin = await requireAdmin()
  const result = await attempt(() => createBroadcast(admin, input), "Không gửi được thông báo. Vui lòng thử lại.")
  if (result.success) revalidatePath("/settings")
  return result
}

/** Pushes the draft to the admin's own devices. Admins only. */
export async function sendTestBroadcastAction(input: unknown): Promise<Result<number>> {
  const admin = await requireAdmin()
  return attempt(() => sendTestBroadcast(admin, input), "Không gửi thử được. Vui lòng thử lại.")
}

/** Cancels one set for later, or takes one sent out of every bell. Admins only. */
export async function revokeBroadcastAction(id: unknown): Promise<Result<"cancelled" | "revoked">> {
  const admin = await requireAdmin()
  const result = await attempt(async () => {
    if (typeof id !== "string") throw new BroadcastError("Thông báo không hợp lệ.")
    return revokeBroadcast(admin, id)
  }, "Không thu hồi được. Vui lòng thử lại.")
  if (result.success) revalidatePath("/settings")
  return result
}

/** The signed-in user's "Tin từ Timi" switch. */
export async function setBroadcastsEnabledAction(enabled: unknown): Promise<Result> {
  const user = await requireSession()
  return attempt(async () => {
    if (typeof enabled !== "boolean") throw new BroadcastError("Giá trị không hợp lệ.")
    await setBroadcastsEnabled(user.uid, enabled)
    return undefined
  }, "Không lưu được. Kiểm tra mạng rồi thử lại.")
}
