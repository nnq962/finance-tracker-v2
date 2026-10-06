# Hệ thống thiết kế

Finance Tracker trông và cảm giác như một app iOS/Android thật. Hệ thống được chốt ngày
2026-10-06, theo mockup "Mobile Finance Dashboard Design" mà người dùng đã duyệt và các ảnh mẫu
trong [`docs/template/`](../template/) (bảng tin, cài đặt, form).

- **Xem trực tiếp:** trang `/design` (mục "Thiết kế" trong menu, chỉ có trên dev server). Ở đó
  có mọi token và khối, đủ sáng lẫn tối. Đó là nguồn chuẩn: trang nào cũng ghép từ những gì
  có ở đó.
- **Bảng màu chi tiết:** [`colors.md`](colors.md).
- **Quy tắc làm việc:** [`web/AGENTS.md`](../../web/AGENTS.md).

shadcn/ui chỉ cung cấp phần **hành vi** (focus, bàn phím, ARIA, portal, định vị; Radix ở dưới).
Phần **diện mạo** nằm trong `components/ui` và đã được may lại theo hệ thống này. Sửa một
component ở đó là cả app đổi theo.

## Nguyên tắc

1. **Thẻ mềm trên nền xám.** Nền xám trung tính rất nhạt (`#f6f6f6`); thẻ trắng bo tròn, không
   viền, không bóng, tách khỏi nền nhờ chênh màu. Theme tối theo iOS: nền đen, thẻ `#1c1c1e`.
2. **Một màu nhấn.** Gần đen (trắng ở theme tối) cho nút chính, chip đang chọn, công tắc bật,
   tiến độ.
3. **Chữ nhẹ.** Chỉ dùng `font-normal` và `font-medium`. Ngoại lệ duy nhất là tiêu đề lớn của
   trang (`font-semibold`).
4. **Màu mang ý nghĩa.** `income` tiền vào, `expense` tiền ra, `transfer` chuyển khoản, `ai`
   AI và Pro, `warning` nhắc nhở. Chỉ tô số tiền, icon, badge; nền nhạt dùng độ mờ
   (`bg-income/10`).
5. **Vừa ngón tay.** Thứ bấm được cao từ 44px. Mọi nút là viên thuốc. Chạm thì hơi lún
   (thu nhỏ 0.97), tắt khi người dùng giảm chuyển động.

## Nền tảng

| | Giá trị |
|---|---|
| Font | Be Vietnam Pro; số tiền `tabular-nums` |
| Cỡ chữ | Số tổng 36 · Tiêu đề trang 30 · Tiêu đề section 20 · Tiêu đề thẻ 18 · Nội dung 16 · Phụ 14 · Chú thích 12 |
| Bo góc | 28 thẻ lớn, sheet, hộp thoại · 24 thẻ, nhóm danh sách · 20 thẻ nhỏ, menu · 16 ô nhập, ô icon · tròn cho nút, chip, badge, công tắc |
| Chiều cao điều khiển | Nút 44 · ô nhập/select trong form 56 (bo 20, lề 20), ô lẻ như thanh tìm kiếm 44 · segmented 40 · 36/32 chỗ chật · 48 nút cuối form |
| Khoảng cách | Lề trang 16 (24 từ md) · giữa các thẻ 16 (24 từ md) · trong thẻ 20, lg 24 |
| Bóng | Thẻ không bóng; chỉ lớp nổi (menu, sheet, hộp thoại, tab bar, nút nổi) có bóng |
| Chuyển động | 150–250ms ease-out; tôn trọng `prefers-reduced-motion` |

## Component (`components/ui`, đã may lại)

- **Button:** viên thuốc. Kiểu `default` (đen), `secondary` (xám), `outline` (trắng có viền),
  `ghost`, `destructive` (đỏ nhạt), `link`. Cỡ `xs` 32 · `sm` 36 · mặc định 44 · `lg` 48;
  `icon` 44, `icon-sm` 36, `icon-xs` 32, `icon-lg` 48.
- **Card:** `size="sm"` (bo 20, đệm 16) · mặc định (24, 20) · `size="lg"` (28, 24) cho thẻ chính
  của trang.
- **Input, Textarea, InputGroup, Select, Combobox:** chữ 16px (để iOS không phóng to). Trong một
  `Field` của form: cao 56, bo 20, lề 20, như mẫu form; đứng riêng (thanh tìm kiếm): cao 44, bo
  16. `Field` đặt kích thước qua biến `--control-h`, `--control-radius`, `--control-px`.
- **Màu ô nhập theo bề mặt** (token `field`, `track` và utility `surface-grouped` / `surface-plain`
  trong `globals.css`): trên nền xám (trang, sheet) ô nhập, chip, nút phụ màu trắng; trên thẻ
  trắng chúng màu xám. Thẻ tự đặt `surface-plain`, khung trang và sheet đặt `surface-grouped`. Trong `SelectContent`, các `SelectItem` luôn nằm trong
  `SelectGroup` (kèm `SelectLabel` nếu nhóm có tên), như shadcn hướng dẫn; danh sách tài khoản
  dùng `AccountSelectGroups`.
- **Tabs:** segmented control dạng viên thuốc, viên đang chọn màu thẻ có bóng nhẹ. Dùng cho 2–3
  chế độ cùng loại (Chi/Thu/Chuyển).
- **ToggleGroup / Toggle:** chip viên thuốc xám, chip đang chọn màu đen; `variant="outline"` là
  chip trắng có viền. Dùng cho bộ lọc, gợi ý, chọn icon/màu.
- **Switch:** cỡ iOS 51×31.
- **Badge:** viên thuốc cao 24; kiểu màu ý nghĩa `income`, `expense`, `transfer`, `ai`,
  `warning`.
- **Sheet:**
  - `variant="screen"`: một màn hình đẩy từ phải, phủ cả điện thoại, có safe-area, nền xám như
    trang; panel 28rem trên desktop. Dùng cho form và màn chi tiết, kèm `SheetNavHeader` (nút
    quay lại tròn ở bên trái, tiêu đề giữa).
  - `variant="bottom"`: thẻ trồi từ đáy, bo 28, có thanh kéo, nền xám để nhóm dòng trắng nổi
    lên. Dùng cho lựa chọn ngắn và hành động.
- **Status bar:** màu cố định bằng màu nền trang (`components/pwa-theme-color.tsx`). Web không
  đổi được màu status bar mượt theo chuyển động, nên mọi lớp phủ phủ tới đầu màn hình (sheet
  `screen`) dùng chung nền xám với trang thay vì đổi màu.
- **Dialog, AlertDialog:** bo 28. Chỉ để xác nhận hoặc nhập rất ngắn; nút huỷ màu xám.
- **DropdownMenu, Select, Combobox (danh sách):** bo 20, dòng cao 40.
- **Progress:** thanh mảnh 6px. **Empty:** icon trong vòng tròn xám.

## Khối kiểu app (`components/app`)

| Khối | Dùng khi |
|---|---|
| `SectionHeader` | Tiêu đề section ngoài thẻ (20px, đậm vừa), kèm ghi chú và "Xem tất cả" |
| `Money` | Mọi số tiền: chữ số đều, "đ" nhỏ và nhạt; cỡ `sm`/`md`/`lg`/`xl`, màu theo `tone` |
| `IconTile` | Icon trên ô màu nhạt ở đầu dòng; màu hạng mục hoặc màu ý nghĩa |
| `DeltaBadge` | % thay đổi so với kỳ trước; xanh khi tốt, đỏ khi xấu |
| `StatGroup` + `Stat` | 2–4 chỉ số chia cột bằng vạch mảnh, mỗi cột có thể mở trang |
| `ProgressRing` | Tiến độ dạng vòng mảnh có số ở giữa |
| `PromoBanner` | Banner đen (sáng ở theme tối) cho một điều đáng chú ý, như gói Pro |
| `FloatingActions` | Nút hành động chính nổi trên thanh tab, trên điện thoại |
| `CompactTitleBar` | Tiêu đề thu nhỏ khi tiêu đề lớn cuộn đi; tự gắn trong `PageHeader` |

Danh sách nằm ở `components/settings-list.tsx`. `SettingsGroup` là nhóm dòng trong một thẻ
(`size="lg"` cho trang dạng bảng tin). `SettingsRow` là một dòng: `media` (thường là
`IconTile`), tiêu đề, mô tả, giá trị, công tắc hoặc mũi tên. Khung app gồm thanh tab dưới nổi
(`components/mobile-bottom-nav.tsx`) và `Page` / `PageHeader` (`components/page.tsx`).

Utility `pressable` (trong `globals.css`) cho phản hồi chạm của thẻ và ô bấm được không phải
`Button`.

## Mẫu màn hình

- **Trang dạng bảng tin** (Tổng quan, duyệt 2026-10-06): lời chào, banner, các thẻ `lg` có nhãn
  xám nhỏ ở đầu rồi con số chính; thẻ cách nhau 16px.
- **Trang danh sách** (Giao dịch, Ngân sách, Cài đặt): tiêu đề lớn, thẻ tóm tắt, rồi các
  `SettingsGroup` có tiêu đề nhóm.
- **Form** (theo mẫu form trong `docs/template/`): sheet `screen` nền xám với `SheetNavHeader`;
  các `Field` xếp dọc thẳng trên nền, nhãn ở trên, ô trắng cao 56; dòng chọn và công tắc trong
  `SettingsGroup`; một nút `lg` rộng hết ở cuối. Nút quay lại là cách huỷ, không cần nút "Huỷ".
