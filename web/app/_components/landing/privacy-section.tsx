import { CookieIcon, CpuIcon, EyeOffIcon, ServerIcon, UserRoundCheckIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"

import { SectionHeading } from "./section-heading"

const POINTS = [
  { icon: UserRoundCheckIcon, title: "Đăng nhập bằng Google", description: "Không cần tạo hay ghi nhớ thêm mật khẩu nào." },
  { icon: CookieIcon, title: "Phiên đăng nhập an toàn", description: "Lưu bằng cookie HTTP-only, mã trên trang không đọc được." },
  { icon: ServerIcon, title: "Xử lý phía máy chủ", description: "Dữ liệu chỉ được đọc, ghi sau khi máy chủ xác minh phiên." },
  { icon: EyeOffIcon, title: "Tách biệt từng người", description: "Mỗi thao tác chỉ chạm tới dữ liệu của chính bạn." },
  { icon: CpuIcon, title: "AI chạy trên máy chủ của app", description: "Câu bạn nhập cho AI không gửi tới dịch vụ AI bên ngoài." },
] as const

/** How the data is kept: the heading on the left, the points as a list of rows, as in the app. */
export function PrivacySection() {
  return (
    <section aria-labelledby="privacy-title" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
        <SectionHeading anchor="bao-mat" id="privacy-title" label="Riêng tư" title="Dữ liệu của bạn, chỉ bạn xem được." align="start">
          Trang này chỉ là lời giới thiệu. Mọi số liệu tài chính nằm sau đăng nhập; không tài khoản, giao dịch hay khoản
          vay nào hiện ở đây.
        </SectionHeading>
        <SettingsGroup>
          {POINTS.map((point) => (
            <SettingsRow key={point.title} icon={point.icon} title={point.title} description={point.description} fullDescription />
          ))}
        </SettingsGroup>
      </div>
    </section>
  )
}
