import { sql } from "kysely"
import { NextResponse } from "next/server"

import { getDb } from "@/lib/db/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const headers = { "Cache-Control": "no-store" }

/** The database answers within 3 s, or the check fails. */
async function databaseUp() {
  const timeout = new Promise<false>((resolve) => setTimeout(() => resolve(false), 3000))
  const query = sql`select 1`.execute(getDb()).then(() => true, () => false)
  return Promise.race([query, timeout])
}

/**
 * For the outside uptime check (UptimeRobot, 2026-10-18): 200 when the app
 * and its database answer, 503 when the database does not. No sign in and
 * nothing about users; the version helps tell which deploy is up.
 */
export async function GET() {
  const up = await databaseUp()
  return NextResponse.json(
    { status: up ? "ok" : "database", version: process.env.NEXT_PUBLIC_APP_VERSION },
    { status: up ? 200 : 503, headers },
  )
}

export async function HEAD() {
  const up = await databaseUp()
  return new NextResponse(null, { status: up ? 200 : 503, headers })
}
