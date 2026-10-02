import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/constants"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"
import { initializeUserWorkspace } from "@/lib/onboarding/bootstrap"
import { closePushSession, openPushSession } from "@/lib/notifications/repository"
import { PUSH_BROWSER_COOKIE, PUSH_SESSION_COOKIE } from "@/lib/notifications/types"

export const runtime = "nodejs"

function isCrossOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (origin === null) return false

  // request.url carries the server's bind address (e.g. 0.0.0.0:3000) in dev,
  // in Docker and behind the Cloudflare Tunnel. The Host header keeps the
  // address the browser actually used, and browsers cannot forge it.
  const host = request.headers.get("host")
  if (!host) return true

  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
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
        const currentSession = await adminAuth.verifySessionCookie(
          currentSessionCookie,
          true,
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

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    })
    const pushContext = await openPushSession(
      decodedIdToken.uid,
      request.cookies.get(PUSH_BROWSER_COOKIE)?.value,
      request.cookies.get(PUSH_SESSION_COOKIE)?.value,
    )
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
