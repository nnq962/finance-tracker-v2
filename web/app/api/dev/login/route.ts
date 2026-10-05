import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"
import { DEV_SESSION_VALUE, DEV_USER, isDevLoginEnabled } from "@/lib/auth/dev-session"
import { seedDevUser } from "@/lib/dev/seed"

export const runtime = "nodejs"

/**
 * Signs the dev server's browser in as the dev user, seeded with sample data
 * on first use, then goes to `next`. Not found unless dev sign-in is on; see
 * isDevLoginEnabled.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get("host")
  if (!isDevLoginEnabled(host)) {
    return new NextResponse(null, { status: 404 })
  }

  await seedDevUser(DEV_USER.uid)

  // Only paths on this site, never another origin.
  const next = request.nextUrl.searchParams.get("next") ?? "/overview"
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/overview"
  // request.url carries the bind address in dev; the Host header is what the browser used.
  const response = NextResponse.redirect(new URL(target, `http://${host}`))
  response.cookies.set(SESSION_COOKIE_NAME, DEV_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })
  response.headers.set("Cache-Control", "no-store")
  return response
}
