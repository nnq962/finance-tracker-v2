import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { getSessionUser } from "@/lib/auth/session"
import { buildExport } from "@/lib/user-data/export"
import { type ExportFormat, type ExportPart, exportParts } from "@/lib/user-data/export-options"

export const runtime = "nodejs"

/**
 * The signed-in user's data as a file to download (Cài đặt › Dữ liệu › Xuất
 * dữ liệu, 2026-10-20): ?format=xlsx|csv&parts=transactions,accounts,… A
 * route, not a Server Action, so the browser saves the response as a file.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn." }, { status: 401, headers: { "Cache-Control": "no-store" } })

  const format: ExportFormat = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx"
  const requested = (request.nextUrl.searchParams.get("parts") ?? "").split(",").filter((part): part is ExportPart => (exportParts as readonly string[]).includes(part))
  const parts = new Set<ExportPart>(requested.length > 0 ? requested : exportParts)

  try {
    const file = await buildExport(user.uid, format, parts)
    return new NextResponse(file.body, {
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Export failed", error)
    return NextResponse.json({ error: "Không tạo được file. Vui lòng thử lại." }, { status: 500, headers: { "Cache-Control": "no-store" } })
  }
}
