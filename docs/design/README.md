# Handoff: Chunky UI (bộ thành phần giao diện + trang Giao dịch)

## Overview
Bộ giao diện phong cách "khối dày", vui tươi cho một app quản lý tài chính cá nhân. Gồm:
1. **Chunky UI Kit**: thư viện thành phần (button, chip, input, checkbox, switch, slider, progress, card, alert, toast, modal…) kèm hướng dẫn thiết kế.
2. **Giao dịch**: trang danh sách thu/chi, thiết kế lại theo phong cách này.
3. **Chunky Buttons**: bảng tham chiếu riêng cho button (màu, kiểu, trạng thái, kích thước, nút icon, ô lựa chọn đáp án).

Hệ thống có **2 theme: Sáng (mặc định) và Tối (`.theme-dark`)**, dùng chung một bộ token CSS.

**Quy tắc cốt lõi: thứ gì bấm được thì NỔI (có cạnh 3D phía dưới, lún xuống khi nhấn). Thứ gì không bấm được thì PHẲNG (viền 2px đều 4 phía, không shadow).** Đây là tín hiệu tương tác chính của hệ thống, không được áp cạnh 3D cho phần tử tĩnh.

## About the Design Files
Các file trong gói này là **bản tham chiếu thiết kế viết bằng HTML**: prototype thể hiện giao diện và hành vi mong muốn, **không phải code production để copy nguyên xi**. Nhiệm vụ là **dựng lại các thiết kế này trong môi trường sẵn có của codebase** (React, Vue, SwiftUI, Flutter…) theo pattern và thư viện đang dùng. Nếu chưa có môi trường, chọn framework phù hợp nhất (gợi ý: React + CSS variables / Tailwind với token bên dưới). `chunky.css` có thể dùng gần như nguyên vẹn làm nền cho lớp token + component CSS.

## Fidelity
**High-fidelity.** Màu, chữ, khoảng cách, bo góc, chuyển động đều là giá trị cuối cùng. Dựng lại pixel-perfect. Riêng **icon là ký tự tạm** (↗ ↙ ⌕ ↻ ‹ › @ ★ ◔ ✓): thay bằng bộ icon của codebase (gợi ý: Lucide / Phosphor, nét 2.5px, bo tròn).

---

## Design Tokens

### Màu
Nguồn gốc định nghĩa bằng `oklch` (trong `chunky.css`); hex là giá trị sRGB quy đổi.

| Token | oklch | Hex | Dùng cho |
|---|---|---|---|
| `--bg` | – | `#fbfaf7` | Nền trang (trắng ngà) |
| `--card` | – | `#ffffff` | Nền thẻ |
| `--ink` | – | `#2b2a33` | Chữ chính |
| `--muted` | – | `#8f8b98` | Chữ phụ |
| `--line` | – | `#e7e4dd` | Viền, rãnh, divider |
| `--line-d` | – | `#d6d2c8` | Viền đậm, cạnh của phần tử xám |
| `--soft` | – | `#f3f1ec` | Nền input, hover nhẹ |
| `--leaf` | 0.76 0.19 138 | `#6ecc49` | Chính / thành công / tiền thu |
| `--leaf-d` | 0.60 0.17 140 | `#3e9727` | Cạnh leaf, chữ số tiền thu |
| `--leaf-t` | 0.95 0.06 138 | `#dbf9d2` | Nền nhạt leaf |
| `--sky` | 0.74 0.14 235 | `#38b8f6` | Chọn / liên kết / focus |
| `--sky-d` | 0.58 0.14 240 | `#0083c4` | Cạnh sky, chữ trạng thái chọn |
| `--sky-t` | 0.95 0.04 235 | `#d6f4ff` | Nền trạng thái chọn, focus ring |
| (sky border) | 0.80 0.09 235 | `#82c7f0` | Viền + cạnh của chip/tab đang chọn |
| `--sun` | 0.85 0.16 85 | `#fdc436` | Phần thưởng / cảnh báo |
| `--sun-d` | 0.70 0.15 70 | `#d98b09` | Cạnh sun |
| `--sun-t` | 0.96 0.06 85 | `#fff0c5` | Nền nhạt sun |
| `--coral` | 0.70 0.19 25 | `#ff645f` | Lỗi / xóa / tiền chi |
| `--coral-d` | 0.56 0.18 25 | `#c8393a` | Cạnh coral, chữ số tiền chi |
| `--coral-t` | 0.95 0.04 25 | `#ffe5e1` | Nền nhạt coral |
| `--grape` | 0.66 0.17 300 | `#a376e9` | Cao cấp / đặc biệt |
| `--grape-d` | 0.52 0.17 300 | `#7a4aba` | Cạnh grape |
| `--grape-t` | 0.95 0.04 300 | `#f2e9ff` | Nền nhạt grape |

Chữ trên nút vàng (sun): `#5a3b00`.

**Token ngữ nghĩa bổ sung** (component nên dùng các token này thay vì hex cố định để theme tối hoạt động):

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--raised` | `#ffffff` | `#2a2831` | Thẻ lồng, tooltip, item segmented đang chọn |
| `--hover` | `#fdfcfa` | `#25232c` | Hover của thẻ bấm được |
| `--knob` | `#ffffff` | `#f2f0f6` | Núm switch, thumb slider |
| `--dis-face` / `--dis-shade` / `--dis-text` | `#e8e6e1` / `#d4d1ca` / `#aaa6ae` | `#2c2a33` / `#211f27` / `#66626f` | Nút disabled |
| `--toast` | `#2b2a33` | `#34313d` | Nền toast |
| `--sky-b` | `#82c7f0` | `#207aaa` | Viền + cạnh của chip / thẻ đang chọn |
| `--leaf-ink` | = `--leaf-d` `#3e9727` | `#94e379` | Chữ màu trên nền `-t` |
| `--sky-ink` | = `--sky-d` `#0083c4` | `#78d0ff` | 〃 |
| `--sun-ink` | `#a45e00` | `#ffd060` | 〃 |
| `--coral-ink` | = `--coral-d` `#c8393a` | `#ff9b93` | 〃 |
| `--grape-ink` | = `--grape-d` `#7a4aba` | `#d0b2ff` | 〃 |

Quy tắc: **`-d` dùng cho cạnh 3D; `-ink` dùng cho chữ/icon màu** (badge, alert, số tiền, chip danh mục, tab/chip đang chọn).

### Dark theme (`.theme-dark`)
Kích hoạt bằng cách thêm class `.theme-dark` lên `<body>` hoặc lên bất kỳ vùng nào (token được scope theo cây DOM, nên có thể đặt vùng tối bên trong trang sáng). Đặt thêm `color-scheme: dark`.

| Token | Tối | Ghi chú |
|---|---|---|
| `--bg` | `#16151b` | Than ấm hơi tím, không đen tuyền |
| `--card` | `#201e26` | Sáng hơn nền 1 bậc |
| `--raised` | `#2a2831` | Sáng hơn thẻ 1 bậc |
| `--ink` | `#f2f0f6` | |
| `--muted` | `#9d99a9` | |
| `--line` | `#35323e` | Viền sáng hơn thẻ để tách khối |
| `--line-d` | `#4a4656` | |
| `--soft` | `#1b1a21` | Nền input (lõm, tối hơn thẻ) |
| `--leaf-t` / `--sky-t` / `--sun-t` / `--coral-t` / `--grape-t` | `#203e1a` / `#113950` / `#4b3711` / `#542523` / `#3b2c54` | Tint tối (oklch L≈0.33) |

Nguyên tắc dark theme:
1. **Không đảo màu.** Mặt màu nhấn (`--leaf`, `--sky`…) và cạnh (`-d`) **giữ nguyên**, nên nút trông y hệt bản sáng.
2. **Độ cao = độ sáng, không dùng shadow mờ:** `--bg` < `--card` < `--raised`.
3. Chữ màu chuyển sang sắc `-ink` sáng (oklch L 0.80–0.88) để đạt tương phản ≥ 4.5:1 trên nền `-t`.
4. Quy tắc "nổi = bấm được" giữ nguyên.
5. Viền avatar và chấm thông báo dùng `var(--card)` (không phải `#fff`) để hòa vào nền thẻ.

Mỗi màu gồm bộ ba **mặt (face) / cạnh (-d) / nền nhạt (-t)**. Cạnh luôn tối hơn mặt khoảng 15% độ sáng, cùng hue.

### Chữ
- **Display**: `Baloo 2` (Google Fonts), 600/700/800. Dùng cho tiêu đề, số tiền, nhãn nút.
- **Body**: `Nunito` (Google Fonts), 600/700/800. Mặc định body weight **700**. Không dùng weight < 600.
- **Mono** (chỉ trong trang kit để chú thích): `JetBrains Mono` 500.

| Vai trò | Font | Size / line-height | Weight | Khác |
|---|---|---|---|---|
| Display / số lớn | Baloo 2 | 40–48px / 1 | 800 | |
| H1 trang | Baloo 2 | 40px / 1 | 800 | |
| H2 section | Baloo 2 | 30px / 1 | 800 | |
| Nhãn nút md | Baloo 2 | 15px / 1 | 800 | UPPERCASE, letter-spacing .06em |
| Nhãn nút sm / tab / segmented | Baloo 2 | 13px / 1 | 800 | UPPERCASE, .06em |
| Nhãn nút lg | Baloo 2 | 19px / 1 | 800 | UPPERCASE, .06em |
| Badge | Baloo 2 | 12px / 1.2 | 800 | UPPERCASE, .06em |
| Body | Nunito | 16px | 700 | |
| Label form | Nunito | 14px | 800 | |
| Caption / help | Nunito | 13px | 700 | màu `--muted` |

### Bo góc
`--r-sm: 10px` · `--r-md: 14px` (nút, input) · `--r-lg: 20px` (thẻ, alert) · nút sm 12px · nút lg 18px · checkbox 9px · pill/badge/chip/track 99px.

### Cạnh 3D (chỉ cho phần tử bấm được)
Thực hiện bằng `box-shadow: 0 <edge> 0 <shade>` (**không blur, không spread**).
| Kích thước | Edge |
|---|---|
| Checkbox, radio, chip, knob switch, tab chọn | 3px |
| Nút sm, nút vuông trong stepper / pager | 4px |
| Nút md (mặc định) | 5px |
| Nút round 64px | 6px |
| Nút lg | 7px |
| Thẻ bấm được | `border-bottom-width: 5px` (thay cho box-shadow) |

Phần tử nổi luôn có `margin-bottom` bằng edge, để khi lún không làm xô lệch bố cục.

### Khoảng cách
Không có thang cố định nghiêm ngặt; các giá trị đang dùng: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28px. Gap giữa thẻ thống kê: 18px. Padding thẻ: 18–28px. Chiều ngang tối đa của trang: 1040px (Giao dịch), 1200px (Kit).

### Easing
- Nhấn nút: `transform, box-shadow` **80ms ease**.
- Nảy (switch knob, dấu tích, tooltip): `cubic-bezier(.3, 1.5, .5, 1)`, 150–220ms.
- Pop (toast, modal): `cubic-bezier(.3, 1.6, .5, 1)` 350ms, từ `translateY(20px) scale(.9) opacity 0`.
- Progress fill: `width .5s cubic-bezier(.3,1.3,.5,1)`.

---

## Components (chi tiết)

### Button `.btn`
- Mặc định: nền `--leaf`, chữ trắng, padding `14px 24px 12px` (padding dưới nhỏ hơn 2px để chữ trông cân với cạnh), radius 14px, `box-shadow: 0 5px 0 --leaf-d`.
- **Hover**: `filter: brightness(1.05)`.
- **Active**: `transform: translateY(5px)` và `box-shadow: 0 0 0` → lún xuống đúng bằng độ dày cạnh.
- **Focus-visible**: `outline 3px solid --sky`, offset 4px.
- Màu: `.sky`, `.sun` (chữ `#5a3b00`), `.coral`, `.grape`.
- `.outline`: nền trắng, viền 2px `--line`, cạnh `--line`, chữ `--sky-d` (hoặc `.neutral` → chữ `--muted`), padding giảm 2px bù viền.
- `.ghost`: không nền, không cạnh, chữ `--sky-d`; hover nền `--sky-t`; không lún.
- `[disabled]`: màu disabled ở trên, không hover, không lún, `cursor: not-allowed`.
- Kích thước: `.sm` (13px, padding `10px 16px 8px`, r12, edge 4), md, `.lg` (19px, padding `18px 36px 16px`, r18, edge 7), `.sq` 48×48, `.round` 64×64 tròn edge 6, `.block` full-width.
- Loading: spinner 16px (viền 3px trắng 40%, top trắng, xoay 0.7s linear) + đổi nhãn "Đang lưu", khóa pointer-events.
- Quy tắc thứ bậc: tối đa **1 nút solid** cho mỗi màn hình/vùng; phụ dùng outline; nhẹ nhất dùng ghost.

### Card `.card`
- **Tĩnh**: nền trắng, `border: 2px solid --line`, radius 20px, **không shadow, không cạnh dưới**.
- **Bấm được** `.card.pressable`: thêm `border-bottom-width: 5px`; hover nền `var(--hover)`; active `translateY(3px)`, `border-bottom-width: 2px`, `margin-bottom: 3px`.
- **Đang chọn** `.card.pressable.selected`: nền `--sky-t`, viền `--sky-b` (chọn một trong nhóm, ví dụ gói hạn mức).
- **Lồng** `.card.raised`: nền `--raised`, dùng cho khối con bên trong thẻ (ví dụ ô "Còn thiếu 1.200.000đ"), padding `14px 16px`.
- **Trống** `.card.dashed`: viền nét đứt, nền trong suốt; nội dung căn giữa: icon 52×52 r16 (nền `--leaf-t`, "+") · tiêu đề · help · nút `.btn.sm`.
- Mọi biến thể dùng token, nên tự đổi màu trong `.theme-dark`.

### Chip `.chip`
Pill, padding `8px 14px 7px`, viền 2px `--line`, `box-shadow 0 3px 0 --line`. Chọn (`.on`): nền `--sky-t`, viền + cạnh `#82c7f0`, chữ `--sky-d`. Nhấn lún 3px. Chọn nhiều (toggle).

### Segmented `.seg`
Container nền `--line`, radius 14, padding 4, gap 4. Item: trong suốt, chữ `--muted`. Item `.on`: nền trắng, chữ `--sky-d`, `box-shadow 0 3px 0 --line-d`. Chọn một.

### Tabs `.tabs`
Hàng nút chữ, gạch chân 2px `--line`. Tab `.on`: chữ `--sky-d`, `border-bottom 4px --sky`. Hover: nền `--soft`.

### Pagination
Nút vuông 44×44, r12, edge 4. Trang hiện tại dùng `.btn.sky`, các trang khác `.outline.neutral`. Có "…" và ‹ ›.

### Input `.input` (PHẲNG, không cạnh)
Nền `--soft`, viền 2px `--line`, radius 14, padding `13px 16px`, Nunito 16/700. Placeholder `#b3afb9`. Hover viền `--line-d`. **Focus**: nền trắng, viền `--sky`, `box-shadow 0 0 0 4px --sky-t`. **Lỗi** (`.field.error`): viền `--coral`, nền `--coral-t`, help text `--coral-d`. **Hợp lệ** (`.field.ok`): viền `--leaf`. Disabled opacity .55. Có biến thể tiền tố (₫, padding-left 44) / hậu tố (VND). Select: mũi tên tự vẽ bằng 2 gradient, padding-right 42. Textarea min-height 96.

### Checkbox / Radio `.check`
Ô 28×28, r9 (radio tròn), nền trắng, viền 2px `--line-d`, cạnh `0 3px 0 --line-d`. Checked checkbox: nền `--leaf`, viền + cạnh `--leaf-d`, dấu tích trắng 3.5px bật ra bằng scale 0→1 với easing nảy. Checked radio: nền `--sky`, chấm trắng 12px. Nhấn: lún 3px. Disabled opacity .5.

### Switch `.switch`
Track 60×34 pill, nền `--line`, `inset 0 3px 0 --line-d` (rãnh **lõm**). Knob 28×26 trắng, `0 3px 0 --line-d` (núm **lồi**), left 3px → 29px khi bật, transition `left .22s cubic-bezier(.3,1.5,.5,1)`. Bật: track `--leaf` + inset `--leaf-d`; knob cạnh `--leaf-d`. Nhấn giữ: knob dãn ngang lên 34px.

### Slider `.slider`
Track cao 16px pill; phần đã chọn tô màu (`--sky` / `.leaf` / `.coral`), phần còn lại `--line` (dùng biến `--p` cập nhật bằng JS). Thumb 32px tròn, nền trắng, viền 3px `-d`, cạnh `0 4px 0 -d`; nhấn: xuống 2px, scale 1.08. Giá trị hiển thị lớn (Baloo 800 20px, màu `-d`) ở góc phải label.

### Stepper
Nút `−` (outline sq) · giá trị (Baloo 800 24px, min-width 56) · nút `+` (sky sq). Khoảng 1–20.

### Badge `.badge` (PHẲNG)
Pill, padding `5px 11px 4px`, Baloo 800 12px UPPERCASE. Nền `-t`, chữ `-d`. Tùy chọn chấm tròn 7px phía trước. `.solid`: nền `--coral`, chữ trắng (đếm số thông báo).

### Avatar (PHẲNG)
48×48 tròn, viền 3px trắng, chữ cái Baloo 800 18px. Xếp chồng: margin-left −12px.

### Progress (PHẲNG)
- Thanh: cao 18px, nền `--line`, fill màu theo mức (leaf < 80%, sun 80–100%, coral > 100%), có vệt sáng trắng 35% (cao 4px, cách trên 4px, cách hai đầu 10px).
- Vòng: 96px conic-gradient `--sun`, lõi trắng 72px, số Baloo 800 22px.
- Các bước: vòng 40px. Xong = nền `--leaf`, dấu ✓ trắng; Hiện tại = nền trắng, viền 3px `--sky`, chữ `--sky-d`; Chưa tới = viền 2px `--line`. Đường nối cao 6px, đã xong thì màu `--leaf`.

### Accordion (PHẲNG)
Nằm trong card tĩnh; divider 2px. Summary padding `16px 20px`; icon "+" trong ô 30×30 r9 `--soft`, khi mở xoay 45° và chuyển nền `--sky-t` / chữ `--sky-d`.

### Skeleton
Khối `--line` với vệt sáng `--soft` chạy ngang (background-size 300%, 1.3s linear infinite). Giữ nguyên hình dạng của nội dung thật.

### Alert (PHẲNG)
Radius 20, viền 2px màu `color-mix(in oklch, currentColor 30%, transparent)`, nền `-t`, chữ `-ink`, padding `16px 18px`. Icon trong ô 32×32 r10 đặc màu. Biến thể: leaf (thành công), sky (thông tin), sun (cảnh báo), coral (lỗi). Tiêu đề 16px, mô tả 14px opacity .85.

### Toast (PHẲNG)
Cố định ở giữa đáy màn hình, cách đáy 24px. Nền `--ink`, chữ trắng, radius 16, padding `14px 20px`, chấm leaf 10px. Pop in; tự tắt sau 2.4s. Xếp chồng dọc, gap 10.

### Tooltip (PHẲNG)
Bong bóng trắng, viền 2px `--line`, r12, padding `8px 12px`, 13px, có mũi nhọn xoay 45°. Hiện khi hover/focus: opacity 0→1, translateY 6px→0 với easing nảy.

### Modal
`<dialog>` max-width 420; backdrop `rgba(43,42,51,.45)` + blur 2px; card tĩnh padding 28, căn giữa. Hero icon 72×72 r22 (nền `-t`, chữ `-d`, Baloo 800 34). Tiêu đề Baloo 800 26px, mô tả 15px `--muted`. Hành động chính: nút `.block` full-width ở cuối (+ nút Hủy outline neutral nếu là thao tác hủy hoại). Pop in; bấm backdrop để đóng.

---

## Screens / Views

### 1. Giao dịch (`Giao dich - Chunky.html`)
**Mục đích**: xem, lọc các khoản thu/chi trong tháng.

**Bố cục** (max-width 1040px, padding `20px 28px 80px`):
1. **Top bar**: trái = nút outline sq (thu gọn thanh bên) + breadcrumb "Giao dịch"; phải = nút outline sq (giao diện sáng/tối).
2. **Header**: H1 "Giao dịch" (Baloo 800 40px) + mô tả "Theo dõi các khoản thu, chi và chuyển khoản của bạn." (16px muted). Phải: nút chính `.btn` leaf "+ THÊM GIAO DỊCH". Gạch dưới 2px `--line`, padding-bottom 26.
3. **Thẻ thống kê**: grid 3 cột, gap 18 (1 cột khi < 820px). Mỗi thẻ là card tĩnh, padding `18px 20px 16px`.
   - Đã thu: badge leaf "ĐÃ THU" + "Chưa có tháng trước" (muted) · số `500.000đ` (Baloo 800 40px, `--leaf-d`) · chân thẻ nét đứt 2px: "1 giao dịch".
   - Đã chi: tương tự với coral, `611.000đ`, "8 giao dịch".
   - Chi nhiều nhất tháng này: ô icon 46×46 r14 nền `--grape-t` · "Mạng xã hội" / "231.000đ" (coral-d) · `38%` (Baloo 800 34, `--grape-d`) · thanh progress grape cao 16px, 38% · chân thẻ: "1 giao dịch" / "TB 231.000đ".
4. **Thanh công cụ** (flex, wrap, space-between):
   - Trái: 4 tab lọc `.btn.outline.sm` (Tất cả / Chi tiền / Thu tiền / Chuyển khoản); tab đang chọn dùng trạng thái sky (nền `--sky-t`, viền + cạnh `#82c7f0`, chữ `--sky-d`).
   - Phải: segmented Tuần / Tháng · nút ‹ · "Tháng 09, 2026" (Baloo 800 15) · nút › · nút tìm kiếm · nút làm mới (đều là outline sq 44×44, edge 4).
5. **Đếm**: "8 giao dịch · tháng này", gạch dưới 2px.
6. **Dòng thời gian**: mỗi ngày là một khối với padding-left 38px.
   - Mốc 25×25 tròn, viền 3px `--line-d`, nền trắng; **ngày hôm nay**: nền `--sun`, viền `--sun-d`. Đường nối nét đứt 3px `--line-d`.
   - Tiêu đề ngày: "THỨ BẢY, 26/09" (Baloo 800 15, UPPERCASE, muted) · phải: tổng ngày (thu `+x` leaf-d, chi coral-d).
   - Danh sách trong card tĩnh; mỗi dòng padding `14px 18px`, divider 2px, hover nền `#faf8f3`: ô mũi tên 44×44 r13 (chi: nền coral-t, ↗; thu: leaf-t, ↙) · tên (16/800) · meta: chip danh mục màu (nền `-t`, chữ `-d`, r7, 12px) + tên ví · phải: số tiền (Baloo 800 18, thu có dấu +) + giờ (13px muted).
   - Màu danh mục: Ăn uống = sun, Vay & nợ = sky, Mạng xã hội = grape, Đi lại = leaf, Thu nhập = leaf.
   - Trạng thái trống: card tĩnh, căn giữa, "Chưa có giao dịch nào ở mục này."

**Dữ liệu**: số liệu từ ngày 24/09 trở đi là **dữ liệu minh họa**, cần nối với nguồn thật.

### 2. Chunky UI Kit (`Chunky UI Kit.html`)
Trang tài liệu: sidebar sticky 220px (mục lục theo nhóm, mục đang xem được tô sáng qua IntersectionObserver) + nội dung. Có 20 section, mỗi section có số thứ tự, tiêu đề, đoạn giải thích và demo tương tác. Không phải màn hình sản phẩm: dùng làm nguồn tham chiếu cho component library / Storybook.

### 2b. Mục "Card · Dark theme" (trong UI Kit, anchor `#card-dark`)
Minh họa thẻ trên nền tối:
- **Khối so sánh**: 2 cột trong một khung viền 2px r20; cùng một thẻ "Đã chi · 611.000đ · 8 giao dịch · +12% so tháng trước", cột trái ở theme sáng, cột phải bọc `.theme-dark`.
- **Sân khấu tối** (`.theme-dark`, nền `--bg`, r24, padding 28): lưới 3 cột, gap `20px 18px`:
  1. Thẻ thống kê tĩnh "Đã thu 500.000đ" (số Baloo 800 36px, `--leaf-ink`; chân thẻ nét đứt).
  2. Thẻ bấm được "Mạng xã hội · Chi nhiều nhất" + chevron ›, `38%` (`--grape-ink`, 28px) + progress grape 14px.
  3. Thẻ mục tiêu "Quỹ du lịch Đà Lạt" + badge sun 60%, lồng `.card.raised` "Còn thiếu 1.200.000đ", progress sun.
  4. (span 2 cột) 3 thẻ gói `.pressable`: Hằng tuần 500k / Hằng tháng 2 triệu (mặc định selected) / Tùy chỉnh —. Bấm để chọn một.
  5. Thẻ trống `.dashed` "Chưa có ví nào" + nút "Thêm ví".
  6. (span 2 cột) Danh sách 3 giao dịch với chip danh mục màu `-t`/`-ink`.
  7. Thẻ skeleton đang tải.
- **Bảng token tối**: 6 ô màu (bg, card, raised, line, line-d, ink).
- < 900px: tất cả về 1 cột.

### 3. Chunky Buttons (`Chunky Buttons.html`)
Bảng tham chiếu button ban đầu: 5 màu, các kiểu, trạng thái, kích thước, nút icon/round (có trạng thái khóa), ô lựa chọn đáp án (default / selected / correct / wrong), thanh phản hồi đúng/sai. Nếu có khác biệt với UI Kit, **UI Kit + `chunky.css` là nguồn chuẩn.**

---

## Interactions & Behavior
- **Lọc giao dịch**: bấm tab → cập nhật tab đang chọn, render lại danh sách chỉ gồm loại tương ứng (`all | out | in | transfer`), cập nhật số đếm, ẩn ngày không còn giao dịch, hiện trạng thái trống nếu rỗng.
- **Tuần / Tháng**: segmented chọn một (hiện chỉ đổi trạng thái hiển thị; cần nối vào logic khoảng thời gian).
- **‹ ›**: chuyển kỳ trước/sau (chưa nối logic).
- **Slider**: cập nhật `--p` và nhãn giá trị theo thời gian thực (hạn mức = value × 500.000đ).
- **Nút lưu**: bấm → trạng thái loading ~1.4s → toast "Đã lưu thành công".
- **Chọn gói (Card Dark)**: click một `.cd-plan` → bỏ `.selected` ở các thẻ khác, thêm vào thẻ được click.
- **Theme**: chuyển sáng/tối bằng cách toggle class `.theme-dark` trên `<body>` (chưa có nút chuyển trong bản thiết kế; nên lưu lựa chọn vào localStorage và mặc định theo `prefers-color-scheme`).
- **Modal**: mở bằng `showModal()`, đóng bằng nút hoặc bấm backdrop; Esc đóng (mặc định của dialog).
- **Responsive**: < 900px (kit) ẩn sidebar, grid về 2 cột; < 820px (Giao dịch) thẻ thống kê về 1 cột, header xếp dọc.
- **Accessibility**: mọi phần tử bấm được đều có `:focus-visible` (outline sky 3px). Checkbox/radio/switch dùng input thật được ẩn đi (vẫn nhận được focus). Nút icon có `aria-label`.

## State Management
- Trang Giao dịch: `filter: 'all'|'out'|'in'|'transfer'`, `period: 'week'|'month'`, `cursorDate` (tháng đang xem), `transactions[]` (`{name, category, wallet, amount, time, kind: 'in'|'out'|'transfer', date}`), dữ liệu thống kê suy ra từ danh sách (tổng thu, tổng chi, danh mục chi nhiều nhất + %).
- Cần fetch theo kỳ (tuần/tháng) và theo bộ lọc; tìm kiếm và làm mới chưa được thiết kế chi tiết.

## Assets
- Font: Baloo 2, Nunito, JetBrains Mono (Google Fonts).
- Không có ảnh bitmap. Icon hiện là ký tự Unicode tạm, cần thay bằng bộ icon thật.

## Files
- `chunky.css`: toàn bộ token + component CSS + dark theme `.theme-dark` (nguồn chuẩn).
- `Chunky UI Kit.html`: thư viện thành phần + hướng dẫn (dùng `chunky.css`).
- `Giao dich - Chunky.html`: màn hình Giao dịch (CSS nội tuyến, cùng token; **chưa hỗ trợ dark theme**: khi dựng lại, dùng token ngữ nghĩa ở trên để tự có theme tối).
- `Chunky Buttons.html`: bảng tham chiếu button.
