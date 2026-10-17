import { NextResponse } from "next/server"

import { getSessionUser } from "@/lib/auth/session"
import { sherpaEnabled } from "@/lib/speech/sherpa"
import { groqEnabled } from "@/lib/speech/groq"

export const runtime = "nodejs"

/**
 * Which recogniser dictation uses: one on the server (this server's, else
 * Whisper on Groq), or, when there is neither, the browser's own. A route
 * rather than a Server Action: the assistant asks as every page opens, and
 * the client sends actions one at a time with a navigation waiting behind
 * them (2026-10-17).
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" }
  if (!(await getSessionUser())) return NextResponse.json("browser", { status: 401, headers })
  return NextResponse.json(sherpaEnabled() || groqEnabled() ? "server" : "browser", { headers })
}
