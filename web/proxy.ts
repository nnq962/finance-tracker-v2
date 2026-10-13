import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"
import { SITE_URL } from "@/lib/site"

/** The app's address before it was named Timi (2026-10-13): its pages move to the new one. */
const OLD_HOST = "finance.nnqlab.dev"

/** Pages that need a signed-in user. */
const SIGNED_IN = /^\/(overview|budget|transactions|categories|debts)(\/|$)/

export function proxy(request: NextRequest) {
  // Behind the tunnel the host the browser asked for comes as x-forwarded-host.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  if (host === OLD_HOST) {
    return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, SITE_URL), 308)
  }

  if (!SIGNED_IN.test(request.nextUrl.pathname) || request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  )

  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Pages only: not the API (webhooks still call the old address), Firebase's
  // sign-in pages under /__/, Next's own files, or files in public/.
  matcher: ["/((?!api/|__/|_next/|.*\\.).*)"],
}
