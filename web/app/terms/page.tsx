import type { Metadata } from "next"

import { LegalDocumentPage } from "@/app/_components/legal-document"
import { termsOfUse } from "@/lib/legal/terms"

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Những gì bạn và Timi cam kết với nhau: tài khoản, gói Pro và hoàn tiền, trợ lý AI, dữ liệu, trách nhiệm.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return <LegalDocumentPage document={termsOfUse} other={{ href: "/privacy", label: "Chính sách quyền riêng tư" }} />
}
