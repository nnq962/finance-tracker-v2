import { LegalDocumentBody } from "@/app/_components/legal-document"
import type { LegalDocument } from "@/lib/legal/types"

const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })

/**
 * Cài đặt › Hỗ trợ › a policy (2026-10-21), in the settings sheet: when it
 * was updated, then the same text as its public page.
 */
export function LegalScreen({ document }: { document: LegalDocument }) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <p className="text-sm text-muted-foreground">Cập nhật {dateFormat.format(new Date(document.updated))}</p>
      <LegalDocumentBody document={document} />
    </div>
  )
}
