import "server-only"
import { cookies } from "next/headers"
import { PUSH_BROWSER_COOKIE, PUSH_SESSION_COOKIE } from "./types"
import { validPushCookie, NotificationValidationError } from "./validation"

export async function getPushContext() {
  const jar = await cookies()
  const browserId = jar.get(PUSH_BROWSER_COOKIE)?.value
  const sessionId = jar.get(PUSH_SESSION_COOKIE)?.value
  if (!validPushCookie(browserId) || !validPushCookie(sessionId)) {
    throw new NotificationValidationError("Phiên thiết bị chưa sẵn sàng. Tải lại trang rồi thử lại.")
  }
  return { browserId, sessionId }
}
