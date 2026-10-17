import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getSessionUser } from "@/lib/auth/session"
import { isCrossOrigin } from "@/lib/http/same-origin"
import { getPushContext } from "@/lib/notifications/context"
import { sendWelcomePush } from "@/lib/notifications/push"
import { getNotificationState, registerPushDevice } from "@/lib/notifications/repository"
import { NotificationValidationError } from "@/lib/notifications/validation"

export const runtime = "nodejs"

/*
 * This device's push state and its registration, for the sync that runs each
 * time the app opens (lib/firebase/push-device.ts). Routes rather than Server
 * Actions, which the client sends one at a time with navigations waiting
 * behind them: the sync held up the first tap on a tab (2026-10-17). The
 * answers have the actions' shape ({ success, data } or { success, error }).
 */
const headers = { "Cache-Control": "no-store" }

async function forUser<T>(expectedUid: unknown, operation: (uid: string) => Promise<T>) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ success: false, error: "Phiên đăng nhập đã hết hạn." }, { status: 401, headers })
  try {
    if (user.uid !== expectedUid) throw new NotificationValidationError("Tài khoản đã thay đổi. Tải lại trang rồi thử lại.")
    return NextResponse.json({ success: true, data: await operation(user.uid) }, { headers })
  } catch (error) {
    if (!(error instanceof NotificationValidationError)) console.error("Notification operation failed", error)
    const message = error instanceof NotificationValidationError ? error.message : "Không thể lưu thông báo. Kiểm tra mạng rồi thử lại."
    return NextResponse.json({ success: false, error: message }, { headers })
  }
}

/** This device's push state: ?uid= the account the page belongs to. */
export async function GET(request: NextRequest) {
  return forUser(request.nextUrl.searchParams.get("uid"), async (uid) => getNotificationState(uid, await getPushContext()))
}

/** Links this device's push id to the account; `welcome` when the user turned notifications on themselves. */
export async function POST(request: NextRequest) {
  if (isCrossOrigin(request)) {
    return NextResponse.json({ success: false, error: "Nguồn yêu cầu không hợp lệ." }, { status: 403, headers })
  }
  const body: unknown = await request.json().catch(() => null)
  const input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
  return forUser(input.uid, async (uid) => {
    const { id, isNew } = await registerPushDevice(uid, await getPushContext(), input.fid, input.name)
    // Only a device just linked to this account is greeted, once.
    if (input.welcome === true && isNew) await sendWelcomePush(input.fid as string)
    return id
  })
}
