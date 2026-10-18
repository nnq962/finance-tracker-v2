import { timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { buildOpsSummary } from "@/lib/ops/summary"
import { sendOps } from "@/lib/ops/telegram"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authorized(request: NextRequest) {
  const secret = process.env.OPS_SECRET
  if (!secret || secret.length < 32) return false
  const given = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "")
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/**
 * The day's summary for the admin's Telegram, asked for by the watcher on
 * the other machine (deploy/watcher) each evening and by its /summary
 * command. Only with OPS_SECRET as a bearer token; otherwise not found.
 * ?send=1 sends it to Telegram too.
 */
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" }
  if (!authorized(request)) return new NextResponse(null, { status: 404, headers })
  const text = await buildOpsSummary()
  if (request.nextUrl.searchParams.get("send") === "1") await sendOps(text)
  return NextResponse.json({ text }, { headers })
}
