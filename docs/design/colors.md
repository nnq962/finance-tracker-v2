# Màu

Bảng màu cho thiết kế lại (10/2026), theo mockup đã duyệt (xem [`README.md`](README.md)). Giá trị gốc nằm trong `web/app/globals.css` (oklch); hex dưới
đây để đọc cho dễ. Bo góc và kích thước component theo mockup, ghi trong README.

## Tinh thần

- **Nền xám nhạt, thẻ trắng không viền, không bóng.** Thẻ tách khỏi nền nhờ chênh màu.
- **Một màu nhấn: gần đen** (trắng ở theme tối) cho nút chính, chip đang chọn, công tắc bật,
  thanh tiến độ. Mỗi màn chỉ một khối đen lớn: thẻ dẫn đầu (`inverse`).
- **Màu ý nghĩa dùng ít:** chỉ tô số tiền vào, icon, badge; đỏ chỉ để cảnh báo. Ô icon dùng
  `tile-tinted`: màu (ý nghĩa hay hạng mục) 15% trộn vào `muted`, icon 45% màu trộn vào màu chữ,
  nên dịu và ngả xám, không thành cầu vồng.
- **Theme tối như mockup:** nền `#0a0a0a`, thẻ `#171717`, nền phụ trắng 6–15%.
- Xám là thang `neutral` của Tailwind, trung tính (không ngả xanh); nền trang hơi ấm (`#f2f2f1`).

## Token

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `background` | `#f2f2f1` | `#0a0a0a` | Nền trang ("Canvas" của mockup) |
| `card` | `#ffffff` | `#171717` | Thẻ |
| `inverse` | `#171717` | `#262626` | Thẻ dẫn đầu (`Card variant="inverse"`): đen ở theme sáng, xám nổi ở theme tối, không phải khối trắng; chữ `inverse-foreground` trắng |
| `popover` | `#ffffff` | `#171717` | Sheet, menu, hộp thoại |
| `foreground`, `primary` | `#171717` | `#ffffff` | Chữ chính, màu nhấn duy nhất (`neutral-900`) |
| `secondary` / `muted` / `accent` | `#f5f5f5` | `#262626` | Skeleton, nền khi nhấn, ô tab đang chọn |
| `muted-foreground` | `#858585` | `#929292` | Chữ phụ, như secondary label của iOS (đổi 2026-10-07 từ `#a3a3a3` / `#737373`) |
| `border` | `#f5f5f5` | `#262626` | Đường kẻ mảnh giữa các dòng |
| `input` | `#e5e5e5` | trắng 15% | Công tắc tắt |
| `field`, `track` | `#f5f5f5` trên thẻ trắng; trên nền xám `field` trắng, `track` một bậc xám đậm hơn nền (`oklch(0.922 …)`) | trắng 6% trên thẻ, `card` trên nền đen | Nền ô nhập, chip, nút phụ (`field`) và rãnh segmented, thanh trượt (`track`), đổi theo bề mặt (`surface-plain` / `surface-grouped`) |
| `ring` | `#a3a3a3` | `#737373` | Viền focus |
| `income` | emerald-600 `#059669` | emerald-400 | Tiền vào ("Success") |
| `expense`, `destructive` | rose-600 `#e11d48` | rose-400 | Tiền ra, xoá, lỗi ("Danger") |
| `transfer` | sky-600 `#0284c7` | sky-400 | Chuyển khoản ("Info") |
| `ai` | xanh ngọc, `oklch(0.6 0.115 195)` | `oklch(0.76 0.12 192)` | AI và gói Pro (đổi từ tím ngày 2026-10-07) |
| `warning` | amber-500 `#f59e0b` | amber-400 | Cảnh báo, nhắc nhở, chấm "có cái mới" |
| `chart-1…5` | tím, xanh ngọc, cam, xanh dương, hồng | bản sáng hơn | Biểu đồ nhiều màu |
| `sidebar` | `#ffffff` | `#171717` | Sidebar desktop |

## Chỉnh trong `components/ui` (chỉ màu)

- `Card`: bỏ bóng và viền ring.
- `Tabs` (segmented): viên đang chọn là `bg-card` có bóng nhẹ trên rãnh `track`; tối là trắng 15%.
- `ToggleGroup` / `Toggle`: mục đang chọn màu `primary` (chip đen).
- `Button outline`, `Item outline`: nền `bg-card` để nổi trên nền trang.
- `Switch`: núm `bg-card`.
- Màu thanh trạng thái PWA: `#f2f2f1` / `#0a0a0a`, cố định; sheet toàn màn hình cùng màu nền nên không cần đổi.
