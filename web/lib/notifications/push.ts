import "server-only"

import { getFirebaseAdminMessaging } from "@/lib/firebase/admin"

/**
 * Greets a device the moment it is linked, so the user sees at once that
 * notifications reach it. A failed send is only logged: the device is linked
 * either way.
 */
export async function sendWelcomePush(fid: string) {
  try {
    await getFirebaseAdminMessaging().send({
      fid,
      notification: {
        title: "🔔 Thông báo đã hoạt động",
        body: "Từ giờ thiết bị này sẽ nhận lời nhắc ghi chép chi tiêu mỗi ngày.",
      },
      data: { type: "welcome" },
      webpush: {
        headers: { TTL: "600" },
        notification: { tag: "welcome" },
      },
    })
  } catch (error) {
    // Avoid logging FIDs or payloads.
    console.warn("Welcome push failed", (error as { code?: string }).code ?? (error as Error).name)
  }
}
