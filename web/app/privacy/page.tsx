import type { Metadata } from "next"

import { LegalDocumentPage } from "@/app/_components/legal-document"
import { privacyPolicy } from "@/lib/legal/privacy"

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư",
  description: "Timi giữ dữ liệu nào, để làm gì, đi qua đâu, lưu bao lâu và bạn làm được gì với nó.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyPolicy} other={{ href: "/terms", label: "Điều khoản sử dụng" }} />
}
