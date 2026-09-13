import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/constants"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"
import { initializeUserWorkspace } from "@/lib/onboarding/bootstrap"

export const runtime = "nodejs"

function isCrossOrigin(request: Request) {
  const origin = request.headers.get("origin")

  return origin !== null && origin !== new URL(request.url).origin
}

export async function POST(request: NextRequest) {
  if (isCrossOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
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
      return NextResponse.json({ error: "An ID token is required." }, { status: 400 })
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
          error: "Please sign in again to create a new session.",
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
          error: "Unable to prepare your workspace. Please try again.",
        },
        { status: 503 },
      )
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    })
    const response = NextResponse.json({ ok: true })

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
      { error: "Unable to create a secure session." },
      { status: 401 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (isCrossOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true })
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
