# Màu

Bảng màu cho thiết kế lại (10/2026), rút ra từ các ảnh mẫu trong
[`docs/template/`](../template/). Giá trị gốc nằm trong `web/app/globals.css` (oklch); hex dưới
đây để đọc cho dễ. Bo góc và kích thước component giữ nguyên theo preset shadcn.

## Tinh thần

- **Nền xám nhạt, thẻ trắng không viền, không bóng.** Thẻ tách khỏi nền nhờ chênh màu.
- **Một màu nhấn: gần đen** (trắng ở theme tối) cho nút chính, chip đang chọn, công tắc bật,
  thanh tiến độ.
- **Màu ý nghĩa dùng ít:** chỉ tô số tiền, icon, badge; nền nhạt bằng độ mờ (`bg-income/10`).
- **Theme tối theo iOS:** nền đen, thẻ `#1c1c1e`, nền phụ `#2c2c2e`.
- Xám ngả rất nhẹ sang tím lạnh (hue 286) cho hợp với nền iOS.

## Token

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `background` | `#f2f2f4` | `#000000` | Nền trang |
| `card` | `#ffffff` | `#1c1c1e` | Thẻ |
| `popover` | `#ffffff` | `#252527` | Sheet, menu, hộp thoại |
| `primary` | `#141416` | `#f5f5f7` | Màu nhấn duy nhất |
| `secondary` / `muted` | `#efeff1` | `#2c2c2e` | Nút phụ, rãnh segmented, skeleton |
| `accent` | `#e9e9ec` | `#3a3a3c` | Nền khi rê/nhấn |
| `muted-foreground` | `#75757c` | `#98989f` | Chữ phụ |
| `border` | `#e7e7ea` | `#333336` | Đường kẻ mảnh |
| `input` | `#dcdce0` | `#48484c` | Nền ô nhập (dùng ở 50%), công tắc tắt |
| `ring` | `#a0a0a8` | `#6e6e75` | Viền focus |
| `destructive` | `#e5484d` | `#ff6369` | Xoá, lỗi |
| `income` | `#10a36a` | `#30c97e` | Tiền vào |
| `expense` | `#e5484d` | `#ff6369` | Tiền ra |
| `transfer` | `#2f6fec` | `#5b9bff` | Chuyển khoản |
| `ai` | `#7c5cf0` | `#a18bff` | AI và gói Pro |
| `warning` | `#f08c1a` | `#ffa53d` | Cảnh báo, nhắc nhở |
| `chart-1…5` | tím, xanh ngọc, cam, xanh dương, hồng | bản sáng hơn | Biểu đồ nhiều màu |
| `sidebar` | `#ffffff` | `#111113` | Sidebar desktop |

## Chỉnh trong `components/ui` (chỉ màu)

- `Card`: bỏ bóng và viền ring.
- `Tabs` (segmented): viên đang chọn là `bg-card` có bóng nhẹ; tối là `bg-input`.
- `ToggleGroup` / `Toggle`: mục đang chọn màu `primary` (chip đen).
- `Button outline`, `Item outline`: nền `bg-card` để nổi trên nền trang.
- `Switch`: núm `bg-card`.
- Màu thanh trạng thái PWA: `#f2f2f4` / `#000000`.
