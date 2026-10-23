# Màu

Bảng màu cho thiết kế lại (10/2026), theo mockup đã duyệt (xem [`README.md`](README.md)). Giá trị gốc nằm trong `web/app/globals.css` (oklch); hex dưới
đây để đọc cho dễ. Bo góc và kích thước component theo mockup, ghi trong README.

## Tinh thần

- **Nền xám nhạt, thẻ trắng không viền, không bóng.** Thẻ tách khỏi nền nhờ chênh màu.
- **Một màu nhấn: gần đen** (trắng ở theme tối) cho nút chính, chip đang chọn, công tắc bật,
  thanh tiến độ. Mỗi màn chỉ một khối đen lớn: thẻ dẫn đầu (`inverse`).
- **Màu ý nghĩa dùng ít:** chỉ tô số tiền vào, icon, badge; đỏ chỉ để cảnh báo. Ô icon dùng
  `tile-tinted` (2026-10-21): màu (ý nghĩa hay hạng mục) 12% trên nền trong suốt (`ai`, `warning` 24%), icon 78% màu trộn đen (theme tối: nền 22%, icon 70% màu trộn trắng); trước đó 15% trộn vào `muted`, icon 45% màu trộn vào màu chữ,
  nên dịu và ngả xám, không thành cầu vồng.
- **Theme tối như mockup:** nền `#0a0a0a`, thẻ `#171717`, nền phụ trắng 6–15%.
- Xám là thang `neutral` của Tailwind, trung tính (không ngả xanh); nền trang hơi ấm (`#f2f2f1`).

## Token

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `background` | `#f0f0f0` (xám trung tính, 2026-10-23) | `#0b0b0b` | Nền trang, cũng là nền sheet (`sheet`) |
| `card` | `#fdfdfd` | `#171717` | Thẻ |
| `inverse` | `#171717` | `#ffffff` | Thẻ dẫn đầu của mọi trang (`Card variant="inverse"`, 2026-10-19): đen ở theme sáng, trắng ở theme tối (trước là xám nổi `#262626`), xám nổi ở theme tối, không phải khối trắng; chữ `inverse-foreground` trắng |
| `popover` | `#fdfdfd` | `#171717` | Menu, popover |
| `foreground`, `primary` | `#171717` | `#ffffff` | Chữ chính, màu nhấn duy nhất (`neutral-900`) |
| `fill-1` / `fill-2` / `fill-3` | mực 4 / 6 / 10% | trắng 8 / 12 / 18% | Lớp xám trong suốt (2026-10-21), hợp mọi bề mặt: ô nhập, chip, ô icon trung tính (`fill-1`); nút xám, rãnh (`fill-2`); công tắc tắt, nút xám khi nhấn (`fill-3`) |
| `secondary` / `muted` / `accent` | `fill-2` | `fill-2` | Skeleton, nền khi nhấn, nút xám |
| `control` + `control-shadow` | trắng, viền 0,5px 4% + `0 1px 2px` 6% + `0 4px 14px` 8% | `oklch(0.29 0.004 286)`, viền sáng 0,5px trắng 10% | Nút `elevated` trên header, viên segmented |
| `row-press` | `fill-1` tô đặc trên thẻ | trắng 8% trên thẻ | Dòng list khi chạm |
| `muted-foreground` | `#696969` (2026-10-23) | `#9e9e9e` (2026-10-23) | Chữ phụ, như secondary label của iOS (đổi 2026-10-07 từ `#a3a3a3` / `#737373`) |
| `border` | `#f5f5f5` | `#262626` | Đường kẻ mảnh giữa các dòng |
| `input` | `#e5e5e5` | trắng 15% | Công tắc tắt |
| `field`, `track`, `segment` | `fill-1`, `fill-2`, `fill-1` | như sáng | Nền ô nhập, chip (`field`); skeleton, thanh trượt (`track`); rãnh segmented (`segment`). Từ 2026-10-21 không còn đổi theo bề mặt |
| `ring` | `#a3a3a3` | `#737373` | Viền focus |
| `income` | emerald-600 `#059669` | emerald-400 | Tiền vào ("Success") |
| `expense`, `destructive` | `#d9534f` | `oklch(0.7 0.15 25)` | Tiền ra, xoá, lỗi ("Danger") |
| `tab-bar`, `tab-pill`, `tab-active` | `#F7F7F7` 92% · `#E6E6E6` · `#0088FF` | thẻ 95% · mực 13% · `#2B8FF5` | Thanh tab điện thoại (2026-10-20, theo kit iOS 26): nền thanh, viên của tab đang mở, màu tab đang mở |
| `expense-on-inverse` | `oklch(0.72 0.17 25)` (đỏ sáng) | `oklch(0.58 0.19 25)` (đỏ đậm) | Chữ đỏ trên thẻ dẫn đầu `inverse` (2026-10-19): đỏ của theme đối diện, vì đỏ thường chỉ 4,5:1 trên đen và 3:1 trên trắng; `Money tone="expense"` tự đổi trong thẻ `inverse` |
| `transfer` | sky-600 `#0284c7` | sky-400 | Chuyển khoản ("Info") |
| `ai` | xanh ngọc, `oklch(0.6 0.115 195)` | `oklch(0.76 0.12 192)` | AI và gói Pro (đổi từ tím ngày 2026-10-07) |
| `warning` | amber-500 `#f59e0b` | amber-400 | Cảnh báo, nhắc nhở, chấm "có cái mới" |
| `chart-1…5` | tím, xanh ngọc, cam, xanh dương, hồng | bản sáng hơn | Biểu đồ nhiều màu |
| `chart-neutral` | `#858585` | `#929292` | Tiền chi bình thường trong biểu đồ (cột, chấm chú thích), để đỏ chỉ còn cho cảnh báo; cùng màu chữ phụ như số chi trong lịch, đủ tương phản 3:1 trên thẻ (2026-10-08) |
| `sidebar` | `#ffffff` | `#171717` | Sidebar desktop |

## Chỉnh trong `components/ui` (chỉ màu)

- `Card`: không viền/ring; bóng `0 1px 2px` 5% + `0 8px 24px` 7% ở theme sáng, viền sáng 1px trắng 4% ở theme tối (2026-10-23).
- `Tabs` (segmented): viên đang chọn là `bg-card` có bóng nhẹ trên rãnh `track`; tối là trắng 15%.
- `ToggleGroup` / `Toggle`: mục đang chọn màu `primary` (chip đen).
- `Button outline`, `Item outline`: nền `bg-card` để nổi trên nền trang.
- `Switch`: núm `bg-card`.
- Màu thanh trạng thái PWA theo nền trang: `#f0f0f0` / `#0b0b0b`; sheet toàn màn hình cùng màu nền nên không cần đổi.
