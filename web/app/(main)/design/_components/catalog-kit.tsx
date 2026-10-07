import type * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** The catalogue's parts in order: id, title, and when to reach for them. */
export const catalogSections = [
  ["foundation", "Nền tảng", "Nguyên tắc, màu, chữ, bo góc và khoảng cách: mọi thứ khác xây trên đây."],
  ["button", "Button", "Hành động chính dùng nút đen; mỗi màn hình chỉ nên có một."],
  ["chip", "Chip & Badge", "Lọc nhanh, gắn nhãn, báo số lượng hoặc trạng thái."],
  ["segmented", "Toggle group", "Chọn một trong vài lựa chọn ngang hàng, đổi ngay khi chạm."],
  ["switch", "Switch · Checkbox · Radio", "Switch bật tắt tức thì, checkbox chọn nhiều, radio chọn một."],
  ["input", "Input", "Nhập liệu: luôn có nhãn, báo lỗi ngay dưới ô."],
  ["select", "Select & Picker", "Chọn giá trị từ danh sách, ngày hoặc giờ."],
  ["slider", "Slider & Stepper", "Chỉnh giá trị liên tục hoặc theo từng bước."],
  ["progress", "Progress", "Cho biết tiến độ và trạng thái đang tải."],
  ["card", "Card", "Gom thông tin liên quan thành một khối, chạm được nếu mở trang khác."],
  ["list", "List", "Danh sách dọc: giao dịch, cài đặt, nội dung mở rộng."],
  ["avatar", "Avatar", "Người dùng, nhóm và trạng thái."],
  ["nav", "Navigation", "Tabs, chỉ báo trang và các bước."],
  ["feedback", "Feedback & Overlay", "Banner, toast, hộp thoại, sheet, tooltip, trạng thái trống."],
] as const

export type CatalogSectionId = (typeof catalogSections)[number][0]

/** One numbered part of the catalogue: "01", its title, a line on when to use it, then the samples. */
export function CatalogSection({ id, children }: { id: CatalogSectionId; children: React.ReactNode }) {
  const index = catalogSections.findIndex(([sectionId]) => sectionId === id)
  const [, title, note] = catalogSections[index]

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="min-w-0 scroll-mt-20 md:scroll-mt-36">
      <div className="mb-3 flex items-baseline gap-3 px-1 pt-6">
        <span className="text-xs text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-xl font-medium tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{note}</p>
        </div>
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-2 md:items-start">{children}</div>
    </section>
  )
}

/** A white card with a small caps caption naming the sample in it. Half width from md up, unless `wide`. */
export function Block({
  label,
  wide,
  className,
  children,
}: {
  label: string
  wide?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card size="lg" className={cn("min-w-0", wide && "md:col-span-2")}>
      <CardContent className={className}>
        <BlockLabel>{label}</BlockLabel>
        {children}
      </CardContent>
    </Card>
  )
}

/** The caption naming a sample, in the mockup's library style: 11px capitals, spaced out. */
export function BlockLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase", className)}>
      {children}
    </p>
  )
}

/** A sample that is its own card (a list group, a banner): spans the row from md up when `wide`. */
export function Wide({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 md:col-span-2">{children}</div>
}
