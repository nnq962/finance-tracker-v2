import { NextResponse } from "next/server"

import { getSessionUser } from "@/lib/auth/session"
import { getNotices } from "@/lib/notices/notices"

export const runtime = "nodejs"

/**
 * The signed-in user's notices, for the bell. A route rather than a Server
 * Action: the client sends actions one at a time and a navigation waits
 * behind them, so the bell's load as the app opened held up the first tap on
 * a tab by up to 2 s on a slow line (2026-10-17, an iPhone's log).
 */
export async function GET() {
  const user = await getSessionUser()
  const headers = { "Cache-Control": "no-store" }
  if (!user) return NextResponse.json([], { status: 401, headers })
  try {
    return NextResponse.json(await getNotices(user.uid), { headers })
  } catch (error) {
    console.error("Notices failed", error)
    return NextResponse.json([], { headers })
  }
}
