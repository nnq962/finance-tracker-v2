import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/constants"
import { forgetSessionCheck, getSessionUser } from "@/lib/auth/session"
import { isCrossOrigin } from "@/lib/http/same-origin"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"
import { initializeUserWorkspace } from "@/lib/onboarding/bootstrap"
import { closePushSession, openPushSession } from "@/lib/notifications/repository"
import { PUSH_BROWSER_COOKIE, PUSH_SESSION_COOKIE } from "@/lib/notifications/types"

export const runtime = "nodejs"

/**
 * Whether this browser still has a valid session, for pages restored from
 * memory (back/forward cache, a resumed PWA) that never asked the server.
 * Returns only the user id, so the client can spot an account switch, and
 * the app's version, so a page from before a deploy reloads there and then
 * rather than at its first tap (which Next turns into a full reload).
 */
export async function GET() {
  const user = await getSessionUser()
  const headers = { "Cache-Control": "no-store" }

  return user
    ? NextResponse.json({ uid: user.uid, version: process.env.NEXT_PUBLIC_APP_VERSION }, { headers })
    : NextResponse.json({ error: "Phiên đăng nhập đã hết hạn." }, { status: 401, headers })
}

export async function POST(request: NextRequest) {
  if (isCrossOrigin(request)) {
    return NextResponse.json({ error: "Nguồn yêu cầu không hợp lệ." }, { status: 403 })
  }

  try {
    const body: unknown = await request.json()
    const idToken =
      typeof body === "object" &&
      body !== null &&
      "idToken" in body &&
      typeof body.idToken === "string"
        ? body.idToken
        : null

    if (!idToken) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin đăng nhập Google." },
        { status: 400 },
      )
    }

    const adminAuth = getFirebaseAdminAuth()
    const decodedIdToken = await adminAuth.verifyIdToken(idToken, true)
    const currentSessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
    let isRefreshingCurrentSession = false

    if (currentSessionCookie) {
      try {
        // The signature is enough: the ID token was just checked against
        // revocation for this same user, which revokes both together.
        const currentSession = await adminAuth.verifySessionCookie(
          currentSessionCookie,
          false,
        )
        isRefreshingCurrentSession = currentSession.uid === decodedIdToken.uid
      } catch {
        isRefreshingCurrentSession = false
      }
    }

    const signedInWithinFiveMinutes =
      Date.now() / 1000 - decodedIdToken.auth_time < 5 * 60

    if (!isRefreshingCurrentSession && !signedInWithinFiveMinutes) {
      return NextResponse.json(
        {
          code: "auth/recent-sign-in-required",
          error: "Vui lòng đăng nhập lại để tạo phiên đăng nhập mới.",
        },
        { status: 401 },
      )
    }

    // Google mints the cookie while the workspace is prepared; it is only
    // handed over once the workspace is ready.
    const sessionCookiePromise = adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    })
    sessionCookiePromise.catch(() => undefined)

    try {
      await initializeUserWorkspace(decodedIdToken.uid)
    } catch (error) {
      console.error("Unable to initialize user workspace", error)
      return NextResponse.json(
        {
          code: "onboarding/initialization-failed",
          error: "Không thể chuẩn bị không gian làm việc. Vui lòng thử lại.",
        },
        { status: 503 },
      )
    }

    const [sessionCookie, pushContext] = await Promise.all([
      sessionCookiePromise,
      openPushSession(
        decodedIdToken.uid,
        request.cookies.get(PUSH_BROWSER_COOKIE)?.value,
        request.cookies.get(PUSH_SESSION_COOKIE)?.value,
      ),
    ])
    const response = NextResponse.json({ ok: true })

    const pushCookieOptions = {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const, path: "/",
    }
    response.cookies.set(PUSH_BROWSER_COOKIE, pushContext.browserId, { ...pushCookieOptions, maxAge: 365 * 24 * 60 * 60 })
    response.cookies.set(PUSH_SESSION_COOKIE, pushContext.sessionId, { ...pushCookieOptions, maxAge: SESSION_DURATION_MS / 1000 })

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    })
    response.headers.set("Cache-Control", "no-store")

    return response
  } catch (error) {
    console.error("Unable to create Firebase session cookie", error)
    return NextResponse.json(
      { error: "Không thể tạo phiên đăng nhập an toàn." },
      { status: 401 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (isCrossOrigin(request)) {
    return NextResponse.json({ error: "Nguồn yêu cầu không hợp lệ." }, { status: 403 })
  }

  try {
    // Browser-scoped secret can detach its own device even if Firebase session expired.
    await closePushSession(
      request.cookies.get(PUSH_BROWSER_COOKIE)?.value,
      request.cookies.get(PUSH_SESSION_COOKIE)?.value,
    )
  } catch (error) {
    console.error("Unable to detach push device during logout", error)
    return NextResponse.json({ error: "Chưa thể gỡ thiết bị thông báo. Kiểm tra mạng rồi đăng xuất lại." }, { status: 503 })
  }
  const signedOut = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (signedOut) forgetSessionCheck(signedOut)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(PUSH_SESSION_COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0, path: "/",
  })
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
  response.headers.set("Cache-Control", "no-store")

  return response
}
