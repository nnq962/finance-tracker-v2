# Giao diện tối giản

Nguồn chuẩn cho giao diện của Finance Tracker từ tháng 10/2026, thay cho Chunky UI
(`Chunky UI Kit.html`, `chunky.css` và `README.md` trong thư mục này chỉ còn là lưu trữ).
Ảnh mẫu tham khảo nằm trong `docs/template/`. Bảng tham chiếu sống: trang `/ui-lab`
khi chạy `npm run dev`.

## Tinh thần

- **App, không phải web.** Thiết kế cho điện thoại trước (390px), desktop là bản mở rộng.
- **Nền xám nhạt, thẻ trắng không viền.** Thẻ tách khỏi nền nhờ độ chênh màu, không dùng
  viền hay bóng. Giao diện tối theo kiểu iOS: nền đen, thẻ xám đậm.
- **Một màu nhấn: đen** (trắng ở giao diện tối) cho nút chính, chip đã chọn, công tắc bật,
  thanh tiến độ.
- **Màu theo ý nghĩa dùng ít:** thu (xanh lá), chi (đỏ), chuyển khoản (xanh dương). Chỉ tô
  số tiền, ô icon, badge; không tô cả khối. Tím chỉ dành cho AI và gói Pro.
- **Bo góc lớn, dạng viên thuốc** cho nút, chip, segmented control.
- **Chữ thường, đậm vừa.** Không viết hoa toàn bộ, không dùng chữ siêu đậm.

## Token (`web/app/globals.css`)

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `background` | `#f2f2f4` | `#000000` | Nền trang |
| `card` / `popover` | `#ffffff` | `#1c1c1e` | Thẻ, sheet, menu |
| `secondary` / `muted` | `#ebebee` | `#2c2c2e` | Nút phụ, chip, track |
| `surface-2` | `#e8e8ec` | `#2c2c2e` | Nền ô nhập |
| `primary` | `#111113` | `#f5f5f7` | Màu nhấn duy nhất |
| `muted-foreground` | `#75757b` | `#98989f` | Chữ phụ |
| `border` | `#e6e6ea` | `#2c2c2e` | Đường kẻ mảnh |
| `income` / `-soft` | `#1a9a50` / `#e2f5e9` | `#3ccf6e` / `#123020` | Tiền thu |
| `expense` / `-soft` | `#e5484d` / `#fde9e9` | `#ff6369` / `#3a1718` | Tiền chi, xoá, lỗi |
| `transfer` / `-soft` | `#2f6fec` / `#e7eefd` | `#6d9bff` / `#15244a` | Chuyển khoản, thông tin |

Dùng qua class Tailwind: `bg-card`, `bg-surface-2`, `text-income`, `bg-expense-soft`…
Không viết cứng mã hex trong component.

## Chữ: Be Vietnam Pro (400 / 500 / 600 / 700)

| Vai trò | Cỡ / độ đậm |
|---|---|
| Tiêu đề lớn của trang | 30 / 600, `tracking-tight` |
| Tiêu đề khối | 20 / 600 |
| Tiêu đề dòng list | 15 / 500 |
| Nội dung | 15 / 400 |
| Chữ phụ, tiêu đề nhóm | 13 / 400–500, màu `muted-foreground` |
| Chú thích | 12 / 500 |
| Số tiền lớn | 36 / 600, `tabular-nums`, đơn vị `đ` nhạt hơn |

Tiêu đề nhóm phía trên thẻ: `text-[13px] font-medium text-muted-foreground`, chữ thường.

## Hình khối

- `--radius: 0.875rem`. Thẻ `rounded-2xl` (~25px), ô nhập `rounded-xl`, nút/chip `rounded-full`,
  sheet đáy `rounded-t-3xl`.
- Chiều cao: ô nhập và nút mặc định 40–44px; vùng chạm tối thiểu 44px.
- Đường kẻ trong list: 1px `border`, bắt đầu từ chỗ chữ như iOS.
- Nhấn: nút co `scale-[0.97]`, thẻ bấm được co `scale-[0.98]`, dòng list đổi nền `secondary`.

## Component (`web/components/ui`)

- **Button**: `default` đen · `secondary` xám · `outline` viền mảnh trên nền thẻ · `ghost` ·
  `grape` (AI, Pro) · `destructive` · `link`.
- **Tabs**: `default` là segmented control kiểu iOS; `line` là gạch chân mảnh.
- **ToggleGroup**: chip xám, chọn thì màu chính.
- **Badge**: viên thuốc chữ thường, nền nhạt theo ý nghĩa; `onFill` cho badge nằm trên nút đặc.
- **Switch**: kiểu iOS, bật thì màu chính.
- **Input / Select / Textarea**: nền `surface-2`, không viền, sáng lên khi focus.

## Khung app trên điện thoại (`web/components/app`)

- **Thanh điều hướng dưới** (`components/mobile-bottom-nav.tsx`): viên thuốc nổi cách mép
  16px, nền thẻ mờ có blur, bóng mềm; viên chỉ báo xám trượt theo mục đang chọn. Khoảng
  nó chiếm được giữ trong biến `--tab-bar-space` trên khung app.
- **Nút nổi** (`FloatingActions`): góc phải dưới, ngay trên thanh điều hướng; nút chính
  ở dưới cùng. Từ md trở lên, nút nằm ở tiêu đề trang.
- **Tiêu đề lớn thu gọn** (`CompactTitleBar`, tự gắn trong `PageHeader`): khi tiêu đề lớn
  cuộn khỏi màn hình, một thanh mờ 44px với tiêu đề nhỏ hiện ở đầu, như iOS.
