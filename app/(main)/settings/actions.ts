"use server"

import { requireSession } from "@/lib/auth/session"
import { getFirebaseAdminMessaging } from "@/lib/firebase/admin"
import { getPushContext } from "@/lib/notifications/context"
import { getCurrentPushFid, detachPushDevice } from "@/lib/notifications/repository"
import { NotificationValidationError } from "@/lib/notifications/validation"

export async function sendPushTestAction(delayed: unknown = false) {
  const user = await requireSession()
  if (typeof delayed !== "boolean") {
    return { success: false as const, error: "Đăng ký thiết bị chưa hợp lệ. Bấm Đăng ký thiết bị rồi thử lại." }
  }

  try {
    const context = await getPushContext()
    // A bounded delay for a manual background test, not a daily reminder scheduler.
    if (delayed) await new Promise((resolve) => setTimeout(resolve, 8_000))
    // Recheck ownership after the delay: logout/account switches invalidate this target.
    const fid = await getCurrentPushFid(user.uid, context)
    const messageId = await getFirebaseAdminMessaging().send({
      // Admin 13.10 uses `token`; FCM accepts registered FIDs here during migration.
      token: fid,
      notification: {
        title: "Thông báo thử từ Finance Tracker",
        body: "Thiết bị đã nhận được thông báo đẩy. Bấm để mở trang Giao dịch.",
      },
      data: { type: "push-test" },
      webpush: {
        headers: { TTL: "60", Urgency: "high" },
        notification: { icon: "/icons/pwa-192.png" },
      },
    })
    return { success: true as const, messageId }
  } catch (error) {
    if (error instanceof NotificationValidationError) return { success: false as const, error: error.message }
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code) : ""
    console.error("Push test failed", { code })
    if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
      const context = await getPushContext().catch(() => null)
      if (context) await detachPushDevice(user.uid, context).catch(() => undefined)
    }
    const message = code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")
      ? "Đăng ký thiết bị không còn hợp lệ. Bấm Đăng ký lại rồi gửi thử."
      : code.includes("mismatched-credential")
        ? "Firebase Admin và Firebase Web đang dùng khác project. Kiểm tra lại biến môi trường."
        : code.includes("authentication") || code.includes("permission")
          ? "Server chưa có quyền gửi FCM. Kiểm tra Firebase Admin credentials và Cloud Messaging API (V1)."
          : "FCM chưa gửi được thông báo. Kiểm tra Firebase Admin credentials, API (V1) và mạng rồi thử lại."
    return { success: false as const, error: message }
  }
}
