import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"
import { DEV_SESSION_VALUE, DEV_TUNNEL_KEY_COOKIE, DEV_USER, isDevLoginEnabled } from "@/lib/auth/dev-session"
import { seedDevUser } from "@/lib/dev/seed"

export const runtime = "nodejs"

/**
 * Signs the dev server's browser in as the dev user, seeded with sample data
 * on first use, then goes to `next`. Not found unless dev sign-in is on; see
 * isDevLoginEnabled.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get("host")
  // Through the dev tunnel the link carries the key once; the browser then keeps it.
  const tunnelKey = request.nextUrl.searchParams.get("key")
  if (!isDevLoginEnabled(host, tunnelKey ?? request.cookies.get(DEV_TUNNEL_KEY_COOKIE)?.value)) {
    return new NextResponse(null, { status: 404 })
  }

  await seedDevUser(DEV_USER.uid)

  // Only paths on this site, never another origin.
  const next = request.nextUrl.searchParams.get("next") ?? "/overview"
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/overview"
  // request.url carries the bind address in dev; the Host header is what the
  // browser used, over https when it came through the tunnel.
  const protocol = request.headers.get("x-forwarded-proto") === "https" ? "https" : "http"
  const response = NextResponse.redirect(new URL(target, `${protocol}://${host}`))
  response.cookies.set(SESSION_COOKIE_NAME, DEV_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })
  if (tunnelKey) {
    response.cookies.set(DEV_TUNNEL_KEY_COOKIE, tunnelKey, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    })
  }
  response.headers.set("Cache-Control", "no-store")
  return response
}
