"use server"

import { requireSession } from "@/lib/auth/session"
import { getDb } from "@/lib/db/client"
import { escapeHtml, notifyOps } from "@/lib/ops/telegram"

import { FEEDBACK_MAX_LENGTH, feedbackKindLabels, feedbackKinds, type FeedbackKind } from "./types"

/**
 * Keeps what the user wrote and tells the admin at once on Telegram (the
 * only place feedback is read for now, 2026-10-20). The version and device
 * come along only when the user left that on.
 */
export async function submitFeedbackAction(input: {
  kind: unknown
  message: unknown
  device?: unknown
}): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireSession()
  const kind = feedbackKinds.includes(input.kind as FeedbackKind) ? (input.kind as FeedbackKind) : null
  const message = typeof input.message === "string" ? input.message.trim() : ""
  const device = typeof input.device === "string" && input.device.trim() ? input.device.trim().slice(0, 200) : null
  if (!kind) return { success: false, error: "Chọn loại góp ý." }
  if (!message) return { success: false, error: "Viết vài dòng cho Timi nhé." }
  if (message.length > FEEDBACK_MAX_LENGTH) return { success: false, error: `Góp ý dài quá ${FEEDBACK_MAX_LENGTH} ký tự.` }

  try {
    await getDb()
      .insertInto("feedback")
      .values({ userId: user.uid, kind, message, appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? null, device })
      .execute()
  } catch (error) {
    console.error("Saving feedback failed", error)
    return { success: false, error: "Không gửi được. Kiểm tra mạng rồi thử lại." }
  }

  const meta = [process.env.NEXT_PUBLIC_APP_VERSION, device].filter(Boolean).join(" · ")
  notifyOps(
    `💬 <b>${escapeHtml(feedbackKindLabels[kind])}</b> từ ${escapeHtml(user.email || user.name)}\n${escapeHtml(message.slice(0, 1500))}${message.length > 1500 ? "…" : ""}${meta ? `\n<i>${escapeHtml(meta)}</i>` : ""}`,
  )
  return { success: true }
}
