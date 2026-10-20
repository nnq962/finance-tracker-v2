import type { Metadata } from "next"

import { LandingFooter } from "@/app/_components/landing/landing-footer"
import { LandingHeader } from "@/app/_components/landing/landing-header"
import { PublicPage } from "@/app/_components/public-page"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SUPPORT_EMAIL } from "@/lib/site"
import { faq } from "@/lib/support/faq"

export const metadata: Metadata = {
  title: "Câu hỏi thường gặp",
  description: "Những câu người dùng Timi hay hỏi: bắt đầu, gói Pro, dữ liệu và quyền riêng tư.",
  alternates: { canonical: "/faq" },
  robots: { index: true, follow: true },
}

/** The questions, public: every answer open, as a page to read and search. */
export default function FaqPage() {
  return (
    <>
      <LandingHeader />
      <PublicPage label="Hỗ trợ" title="Câu hỏi thường gặp" lead={`Không thấy câu bạn cần? Viết cho ${SUPPORT_EMAIL}, hoặc Góp ý trong app ở Cài đặt › Hỗ trợ.`}>
        {faq.map((group) => (
          <SettingsGroup key={group.title} title={group.title}>
            {group.items.map((item) => (
              <SettingsRow key={item.q} title={item.q} description={item.a} fullDescription />
            ))}
          </SettingsGroup>
        ))}
      </PublicPage>
      <LandingFooter />
    </>
  )
}
