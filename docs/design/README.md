# Hệ thống thiết kế

Finance Tracker trông và cảm giác như một app iOS/Android thật. Hệ thống được chốt ngày
2026-10-07, theo mockup "Mobile Finance Dashboard Design" (Figma Make: bảng tin và trang "Thư viện
UI") mà người dùng đã duyệt. Mockup và ảnh mẫu không còn giữ trong repo: trang `/design` là bản
chuẩn duy nhất.

- **Xem trực tiếp:** trang `/design` (dòng "Thiết kế" trong Cài đặt, chỉ có trên dev server), dựng
  theo trang "Thư viện UI" của mockup: 14 nhóm đánh số, hàng chip mục lục bám khi cuộn. Ở đó
  có mọi token và khối, đủ sáng lẫn tối. Đó là nguồn chuẩn: trang nào cũng ghép từ những gì
  có ở đó.
- **Bảng màu chi tiết:** [`colors.md`](colors.md).
- **Quy tắc làm việc:** [`web/AGENTS.md`](../../web/AGENTS.md).

shadcn/ui chỉ cung cấp phần **hành vi** (focus, bàn phím, ARIA, portal, định vị; Radix ở dưới).
Phần **diện mạo** nằm trong `components/ui` và đã được may lại theo hệ thống này. Sửa một
component ở đó là cả app đổi theo.

## Nguyên tắc

1. **Thẻ mềm trên nền xám.** Nền trắng ngà rất nhạt (`#f2f2f1`, "Canvas" của mockup); thẻ trắng
   bo 20, không viền, không bóng, tách khỏi nền nhờ chênh màu. Xám là thang `neutral` của
   Tailwind (không ngả xanh). Theme tối: nền `#0a0a0a`, thẻ `#171717`.
2. **Một khuôn trang** (2026-10-08). Mọi trang mở đầu giống nhau: một hàng gọn, tên trang bên
   trái, công cụ bên phải (`PageHeader`); rồi một thẻ dẫn đầu, rồi các nhóm. Học một trang là đoán
   được các trang khác. Xem "Khuôn trang" bên dưới.
3. **Một mảng đen.** `neutral-900` cho thẻ dẫn đầu (`Card variant="inverse"`), nút chính, nút nổi,
   chip đang chọn, công tắc bật. Mỗi màn chỉ một khối đen lớn: thanh tab, segmented control, lời
   mời Pro đều sáng.
4. **Chữ rõ thứ bậc.** Số tiền của thẻ dẫn đầu là chữ lớn nhất màn; tên trang 24, số tiền và
   tiêu đề đậm 600, chữ thường 400.
5. **Màu dịu, có ý nghĩa.** `income` tiền vào (emerald), `expense` tiền ra (rose), `transfer`
   chuyển khoản (sky), `ai` AI và Pro (xanh ngọc), `warning` nhắc nhở (amber). Ô icon dùng màu
   đó (hay màu hạng mục) đã làm dịu về xám, icon màu mực (`tile-tinted`), để list không thành cầu
   vồng. Số tiền: chỉ tiền vào có màu; tiền chi, chuyển khoản để màu chữ thường. Đỏ chỉ để cảnh
   báo thật: quá hạn, số dư âm.
6. **Vừa ngón tay.** Thứ bấm được cao từ 44px. Mọi nút là viên thuốc. Chạm thì hơi lún
   (thu nhỏ 0.97), tắt khi người dùng giảm chuyển động.
7. **Ít chữ.** Nhãn, mô tả, thông báo ngắn và dễ hiểu, giọng trung tính ("Thêm tài khoản", không
   "Chỉ cần…", "Ví dụ…"). Mô tả dưới dòng chỉ ghi điều tiêu đề chưa nói hoặc điều cần làm trước.
   Một thứ gọi một tên trong cả app: "hạng mục", "lượt AI".

## Nền tảng

| | Giá trị |
|---|---|
| Font | Be Vietnam Pro; số tiền `tabular-nums` |
| Cỡ chữ | Tên trang 24 (đổi 2026-10-08: đầu trang gọn kiểu app ngân hàng, thay tiêu đề lớn 28) · Nhãn 12 in hoa giãn chữ, đậm 600 (tiêu đề nhóm list) · Title 20 (tiêu đề nhóm) · Headline 16 (tiêu đề thẻ, hộp thoại, trạng thái trống) · Body 14 (nội dung, dòng list, nút, nhãn ô) · Caption 12 (mô tả dòng, lỗi và ghi chú dưới ô). Số tiền lớn 34; chữ trong ô nhập 16 để iOS không phóng to |
| Độ đậm | Số tiền, tiêu đề (trang, nhóm, thẻ, hộp thoại, sheet), nút và con số lớn 600 (`font-semibold`); tiêu đề dòng list, segmented, nhãn ô 500; chữ thường 400 |
| Màu chữ phụ | `muted-foreground` như secondary label của iOS: `#858585` theme sáng, `#929292` theme tối (đổi 2026-10-07 từ `#a1a1a1` / `#737373`, quá nhạt). Làm mịn nét `antialiased` chỉ ở theme tối |
| Bo góc | 32 đầu sheet đáy · 28 đầu sheet `bottom` · 24 thẻ lớn (`size="lg"`), action sheet · 20 thẻ, nhóm danh sách, hộp thoại, menu · 16 thẻ nhỏ, banner, ô icon lớn, ô OTP · 12 ô nhập, select, ô tháng · 10 ô icon trong dòng · tròn cho nút, chip, badge, công tắc (đổi 2026-10-07: thẻ từ 28 xuống 20, ô nhập từ viên thuốc 48 xuống 44 bo 12, như list của app Claude) |
| Chiều cao điều khiển | Nút: L 56 · M 44 (mặc định) · S 36 · nút nổi chính 60 (`size="fab"`) · ô nhập, select, thanh tìm kiếm 44, cùng cao với nút mặc định · segmented 52 (lựa chọn 44) · nút tròn icon 44 · công tắc 52×32 |
| Khoảng cách | Bội của 4. Lề trang 16 (24 từ md) · giữa các phần của trang và các nhóm list 24 (32 từ md; `Page` và layout trang tự lo) · tiêu đề → nội dung 8 · các thứ trong một phần 12 (thẻ cạnh thẻ, segmented → list) · đệm thẻ 16 `sm`, 20, 24 `lg`. Tiêu đề luôn gần nội dung của nó hơn phần phía trên: với `Section` thấy ~16 dưới tiêu đề, ~32 trên |
| Bóng | Thẻ không bóng; chỉ lớp nổi (menu, sheet, hộp thoại, tab bar, nút nổi) có bóng |
| Chuyển động | 150–250ms ease-out; chỉ báo trượt (segmented, công tắc) nảy nhẹ ~450ms. Dùng CSS transition trên `translate`/`opacity` hoặc `motion` cho chiều cao, không dùng layout animation hay transition `grid-template-rows` (giật trên iOS Safari). Khi `prefers-reduced-motion`, rút còn 150ms ease-out, không nảy, thay vì tắt hẳn |

## Component (`components/ui`, đã may lại)

- **Button:** viên thuốc. Kiểu `default` (đen), `secondary` (xám), `outline` (trắng có viền),
  `ghost`, `destructive` (đỏ nhạt), `link`. Cỡ: `lg` 56 · mặc định 44 · `sm` 36
  (thêm `xs` 32); `icon` 44, `icon-sm` 36, `icon-xs` 32, `icon-lg` 48, `fab` 60. Icon trong nút
  18px; nút tắt mờ còn 35%.
- **Card:** bo 20, đệm 20 · `size="lg"` (bo 24, đệm 24) cho thẻ chính của trang ·
  `size="sm"` (bo 16, đệm 16). Nhãn trong thẻ (`CardLabel`): chữ thường 14px màu phụ, như "Tài
  sản ròng". `variant="inverse"`: thẻ dẫn đầu cho một con số như số dư, mỗi trang một thẻ: đen ở
  theme sáng, xám nổi (`neutral-800`) ở theme tối, không bao giờ là khối trắng (token `inverse`).
  `asChild`: thẻ là phần tử con, như một nút cho thẻ bấm cả khối (thẻ Tiền vào / Tiền ra ở Giao
  dịch, đang chọn thì `inverse`).
- **Input, Textarea, InputGroup, Select, Combobox:** chữ 16px (để iOS không phóng to). Cao 44 và
  bo 12, cùng cao với nút mặc định, trong form cũng như đứng riêng (thanh tìm kiếm); `Textarea` và
  `InlineSelect` khi cao lên vẫn giữ góc 12. Khi focus, ô chuyển nền trắng (màu thẻ) và có viền đậm
  2px màu nhấn; khi lỗi, viền 2px màu `destructive`. Kích thước đặt qua biến `--control-h`,
  `--control-radius`, `--control-px` (mặc định 44, 12, 16). `InputGroup variant="search"`: ô tìm kiếm đứng riêng (trang Giao dịch), tròn như nút
  và không đổi nền, không viền khi focus.
- **Màu ô nhập theo bề mặt** (token `field`, `track` và utility `surface-grouped` / `surface-plain`
  trong `globals.css`): trên nền xám (trang, sheet) ô nhập, chip, nút phụ màu trắng; trên thẻ
  trắng chúng màu xám. Thẻ tự đặt `surface-plain`, khung trang và sheet đặt `surface-grouped`. Trong `SelectContent`, các `SelectItem` luôn nằm trong
  `SelectGroup` (kèm `SelectLabel` nếu nhóm có tên), như shadcn hướng dẫn; danh sách tài khoản
  dùng `AccountSelectGroups`.
- **Tabs:** segmented control kiểu iOS, viên thuốc cao 52 (lựa chọn 44): viên trắng có bóng nhẹ
  trượt trên rãnh xám (`track`; trên nền xám của trang là một bậc xám đậm hơn nền), lựa chọn đang
  chọn chữ đậm. Theme tối: viên xám sáng trên rãnh màu thẻ. Dùng cho 2–4 chế độ cùng loại (Chi/Thu/Chuyển). `variant="line"`: tab gạch chân,
  vạch trượt theo.
- **ToggleGroup / Toggle:** chip viên thuốc xám chữ thường (không đậm), chip đang chọn màu đen;
  `variant="outline"` là chip trắng có viền; `variant="segmented"` là vài lựa chọn icon trên rãnh
  xám bo 16, lựa chọn đang chọn là ô trắng có bóng nhẹ (kiểu iOS). Dùng cho bộ lọc, gợi ý, chọn
  icon/màu.
- **Switch:** như mockup: rãnh 52×32, núm 24 cách mép 4, dấu ✓ 12 khi bật; tắt là rãnh `neutral-200`.
- **Checkbox:** ô 24 bo 8, viền 1.5 `neutral-300` khi chưa chọn, đen có ✓ khi chọn; `shape="circle"` cho danh sách chọn nhiều kiểu iOS.
  **RadioGroup:** vòng 24, đen với chấm sáng khi chọn.
- **Slider:** rãnh dày 8, núm trắng; hai giá trị là khoảng; `formatValue` hiện bong bóng giá trị
  khi kéo.
- **Accordion:** câu hỏi chữ 14, dòng cao từ 56, nút + trong vòng xám xoay thành × khi mở.
- **Progress:** thanh dày 8; `tone="ai"` màu xanh ngọc cho lượt AI (Cài đặt), để không thành thêm một khối đen. **Empty:** icon mảnh trong ô 80 bo 20 nền `field` theo bề mặt (trắng trên nền xám của trang, sheet; xám trên thẻ trắng), tiêu đề 16. Đồng hồ lượt AI ghi "Còn N/M", nên thanh đầy là chưa dùng.
- **Skeleton:** nền theo bề mặt (`track`): đậm hơn nền xám của trang, xám rất nhạt trên thẻ trắng, sáng 15% trên thẻ dẫn đầu. Không truyền `bg-*` ở nơi dùng. Ngừng nhấp nháy khi giảm chuyển động.
- **Badge:** viên thuốc cao 24 có chấm màu ở đầu; kiểu màu ý nghĩa `income`, `expense`,
  `transfer`, `ai`, `warning`; `count` là số đỏ đặc trên icon. Có cái mới mà không cần số (chuông
  thông báo): chấm cam 6px như mockup.
- **Sheet:**
  - `variant="screen"`: một màn hình đẩy từ phải, phủ cả điện thoại, có safe-area, nền xám như
    trang; panel 28rem trên desktop. Dùng cho form và màn chi tiết, kèm `SheetNavHeader` (nút
    quay lại tròn ở bên trái, tiêu đề giữa).
  - `variant="bottom"`: thẻ trồi từ đáy, bo 28, có thanh kéo, nền xám để nhóm dòng trắng nổi
    lên. Dùng cho lựa chọn ngắn và hành động.
- **Drawer mặc định (sheet đáy):** như half sheet của mockup: sát hai mép, đầu bo 32, thanh kéo
  40×6 `neutral-200`, nội dung căn trái.
- **Drawer `variant="page"` (page sheet iOS):** trồi lên tới ngay dưới status bar, đầu bo 28, kéo
  xuống để đóng; giữa màn hình, rộng tối đa 32rem trên desktop. Không dùng thẳng: dùng qua khối
  `PageSheet`.
- **Status bar:** màu cố định bằng màu nền trang (`components/pwa-theme-color.tsx`). Web không
  đổi được màu status bar mượt theo chuyển động, nên mọi lớp phủ phủ tới đầu màn hình (sheet
  `screen`) dùng chung nền xám với trang thay vì đổi màu.
- **Toast (Sonner, `components/ui/sonner.tsx`):** như mockup, kiểu banner iOS chứ không phải
  thông báo web: viên thuốc đen (trắng ở theme tối) rộng vừa chữ, giữa phía trên, ô tròn màu
  theo trạng thái (thành công `income`, lỗi `destructive`, cảnh báo `warning`, thông tin
  `transfer`) chứa glyph trắng, bóng mềm; nút Hoàn tác là viên nhỏ trong toast. Sonner vẫn lo
  xếp chồng, vuốt để đóng, hẹn giờ.
- **Dialog, AlertDialog:** bo 20. Chỉ để xác nhận hoặc nhập rất ngắn; nút huỷ màu xám.
- **DropdownMenu, Select, Combobox (danh sách):** bo 20, dòng cao 40.

## Khối kiểu app (`components/app`)

| Khối | Dùng khi |
|---|---|
| `Section` | Một phần có tiêu đề ngoài thẻ (`SectionHeader`: 20px, đậm vừa, kèm ghi chú và "Xem tất cả ›" (đậm vừa, `foreground/70`, có mũi tên, vùng chạm 44) hoặc nút); nội dung cách tiêu đề 8, các thứ bên trong cách nhau 12. Phần có tiêu đề lớn luôn dùng nó |
| `Money` | Mọi số tiền: chữ số đều, "đ" viết liền sau số (55.103.000đ); ở cỡ lớn (`lg`, `xl`) "đ" nhỏ hơn và mờ 50% như mockup; cỡ `sm` 14 / `md` 16 / `lg` 20 / `xl` 34, màu theo `tone`. `fit`: cho ô hẹp có độ rộng cố định (FlowTiles): số luôn một dòng, co theo `@container` gần nhất từ cỡ của nó xuống 3/4 (lg: 20 → 15), vẫn không vừa thì viết gọn (+125tr, −1,25tỷ); luôn chỉ một dạng hiện, số đầy đủ cho trình đọc màn hình và tooltip. Trình duyệt không có `round()` hay `cqi` (iOS 15, Chromium cũ) thì chỉ hiện số đầy đủ. Lưu ý: Be Vietnam Pro không có chữ số đều (`tnum`), nên `tabular-nums` không có tác dụng |
| `IconTile` | Icon trên ô vuông bo góc nền nhạt (như mockup); màu hạng mục hoặc màu ý nghĩa, làm dịu về xám với icon màu mực (`tile-tinted`, 2026-10-08). Cỡ `sm` 36 (mọi dòng list, qua `SettingsRow`), `md` 40 (bo 10), `lg` 48 (bo 16; đầu thẻ, đầu sheet); `shape="circle"` chỉ cho chữ cái, khuôn mặt |
| `DeltaBadge` | % thay đổi so với kỳ trước, dạng chữ nhỏ có mũi tên ("↘ 93%") như mockup, không nền; xanh khi tốt, đỏ khi xấu |
| `StatGroup` + `Stat` | 2–4 chỉ số chia cột bằng vạch mảnh, mỗi cột có thể mở trang |
| `ProgressRing` | Tiến độ dạng vòng mảnh có số ở giữa |
| `FormSection` | Các trường của một form trong thẻ trắng, có tiêu đề nhỏ, ghi chú và nội dung phụ bên dưới |
| `PromoBanner` | Thẻ sáng cho một điều đáng chú ý, như lời mời Pro (cuối Tổng quan): ô icon `lg` màu `tone` (mặc định `ai`), tiêu đề, một dòng, mũi tên. Sáng để không tranh với thẻ dẫn đầu. Luôn rộng hết chỗ chứa; nơi dùng không đặt độ rộng |
| `FloatingActions` | Nút hành động chính nổi phía trên thanh tab, trên điện thoại; tự chừa một khoảng cuối trang để dòng cuối cuộn lên khỏi nút. `FloatingActionsSkeleton`: nút + đứng sẵn chỗ trong màn tải, không bấm được, để khỏi bật ra khi trang tới |
| `MobileBottomNav` | Thanh tab nổi trên điện thoại (`components/mobile-bottom-nav.tsx`): viên thuốc mờ rộng ngang màn hình (tối đa 28rem), mỗi tab icon 22 và tên 11 bên dưới (đổi 2026-10-08: trước chỉ có icon, nên không gì gọi tên trang); viên xám nhạt trượt tới tab đang mở, tab đó icon và chữ đậm màu chữ. Mỗi tab nhớ vị trí cuộn (theo URL, kể cả query; trang con như /design, /settings/plan luôn mở ở đầu); chạm lại tab đang mở thì cuộn về đầu (mượt, tức thì khi giảm chuyển động); trượt ngón ra khỏi tab trước khi nhấc thì huỷ |
| `PageHeader` | Đầu mọi trang (`components/page.tsx`), kiểu app ngân hàng Việt Nam (Cake, Timo), chọn 2026-10-08: một hàng cao 44 (64 từ md), cuộn cùng trang (không dính, không thu gọn). Bên trái tên trang 24 đậm 600, hoặc `lead` thay chỗ đó (Tổng quan: avatar, lời chào theo giờ, tên đầy đủ, mở Cài đặt; tên trang vẫn là h1 cho trình đọc màn hình). Bên phải: `tools` (mọi cỡ: tháng, chuông), `accessory` (nút tròn 44, dạng điện thoại của `actions`: dưới md khi có `actions`), `actions` (nút có chữ từ md). Cách nội dung 16 trên điện thoại. `PageHeaderSkeleton` hiện tên trang thật. Số đếm không nằm ở đầu trang mà trong tiêu đề nhóm ("ĐANG DÙNG · 3") |
| `InlineSelect` | Dropdown mở tại chỗ, đẩy nội dung bên dưới xuống: chọn trong vài tài khoản, ví. Hiệu ứng chiều cao đơn giản (300ms ease-out); trên iOS kém mượt hơn transform, đã chấp nhận. Danh sách dài vẫn dùng `Select`/`Combobox` |
| `CardLabel` | Nhãn nhỏ trong thẻ ("Tài sản ròng", "Tiền vào"): chữ thường cỡ Body, màu phụ; trên thẻ `inverse` thì sáng 60%. Mọi thẻ có nhãn dùng nó |
| `Chip` | Chip tĩnh cho thứ đã chọn hoặc gắn kèm (người, thẻ #): có thể có avatar và nút × |
| `ChipRow` | Hàng chip cuộn ngang, chạy tới mép màn (bù `--main-content-px`), chip đầu vẫn thẳng hàng trang; có chừa 4px trên dưới cho viền focus. Đi kèm `ChipButton` (chip mở một thứ, như sheet lọc; `active` tô đậm khi điều kiện đang bật, ghi "Lọc · 2") và `ChipRowDivider` (vạch đứng giữa nút lọc và các chip loại). Chip chọn là `ToggleGroup` `size="sm"` |
| `MonthPickerSheet` | Chọn tháng từ sheet đáy: năm với ‹ ›, lưới 12 tháng, tháng chưa tới mờ đi, nút "Về tháng này" |
| `MonthSelect` | Tháng đang xem dạng nút viên thuốc "Tháng 10, 2026 ▾", chạm mở `MonthPickerSheet`; tới tháng nào cũng hai chạm. Một cách đổi tháng duy nhất cho trang có tháng, không kèm mũi tên ‹ ›. `size="bar"`: cao 44 và gọn ("Tháng 10", năm khác thì "Tháng 10/2025") cho đầu trang |
| `Stepper` | Đếm từng bước bằng − / + (số người, số tháng) |
| `OtpInput` | Mã một lần trong các ô riêng; tự nhảy ô, dán được cả mã |
| `WheelPicker` + `WheelPickerGroup` | Bánh xe cuộn kiểu iOS để chọn giờ, phút |
| `DateStrip` | Một tuần ngày nằm ngang để chọn một ngày; chấm đánh dấu ngày có việc |
| `RulerSlider` | Thước vạch kéo để chọn giá trị, kim màu `warning` |
| `Rating` | Sao 1–5 |
| `SegmentedProgress` | Tiến độ chia đoạn: các bước của một luồng, độ mạnh mật khẩu |
| `Steps` | Các bước có tên nối bằng đường kẻ: xong có ✓, đang làm có viền |
| `PageDots` | Chỉ báo trang; chấm hiện tại kéo dài thành vạch |
| `Carousel` | Thẻ vuốt ngang, bắt từng thẻ, kèm `PageDots` |
| `SwipeRow` | Vuốt trái để lộ một hành động (mặc định Xoá); dùng qua `SettingsRow swipeAction` để dòng vuốt giống mọi dòng khác |
| `ActionSheet` | Danh sách lựa chọn ngắn trồi từ đáy, Huỷ tách riêng bên dưới (vaul) |
| `NoticeBanner` | Thông báo trong trang trên nền nhạt theo `tone`, đóng được (`onDismiss`), hoặc bấm cả khối kèm mũi tên để mở thứ nó nói tới (`onClick`, như khoản quá hạn ở Vay nợ), hoặc kèm một nút nhỏ ở cuối cho bước tiếp theo (`action`, như "Ghi khoản chi" sau khi thanh toán gói) |
| `PageSheet` | Page sheet iOS (`Drawer variant="page"`), tên theo thiết kế: thanh trên cùng có nút ✕ tròn (cách mép trên và trái 16), tiêu đề giữa, `action` bên phải; `hideTitle` khi nội dung tự mở đầu bằng tiêu đề lớn (màn gói). Nội dung cuộn xuyên dưới thanh, như sheet của app Claude: nội dung cuộn lên tới tận mép trên của sheet, thanh kéo nổi bên trên; khi đã cuộn, một lớp màu nền sheet phủ từ mép trên (cả chỗ thanh kéo) qua cả thanh, đậm nhất ở mép trên rồi nhạt đều qua hết thanh, về 0 ở 16px dưới thanh; nội dung vẫn thấp thoáng bên dưới, không có đường kẻ. Khi thanh có tiêu đề, lớp phủ giữ dày qua dòng tiêu đề để chữ rõ. Nút tròn trên thanh khi đó có bóng mềm (theme tối: viền mảnh). `surface="grouped"` (xám, cho thẻ trắng) hoặc trắng cho form; `footer` cho nút Lưu. Dùng cho màn gói, Thông báo |
| `ChoiceTiles` | Vài ô cạnh nhau, chọn một, như bảng giá: vòng radio ở đầu, chip đối diện (ngắn, như "Giảm 28%"), rồi con số và một dòng mô tả. Radio group bên dưới (phím mũi tên, trình đọc màn hình). `tone="ai"` tô ô đang chọn màu `ai` (kỳ thanh toán Pro); mặc định viền đen |
| `FlowTiles` | Tiền theo hai chiều (Tiền vào / Tiền ra ở Giao dịch, Cần thu / Cần trả ở Vay nợ) là hai nửa của một thẻ, chia bằng vạch mảnh thụt 16 trên dưới (như Figma). Mỗi nửa là `@container`, số tiền dùng `Money fit` nên không bao giờ ngắt giữa số: ô icon, nhãn, số tiền `lg` có dấu (chỉ tiền vào có màu) và ghi chú; không có `onValueChange` thì thẻ chỉ hiển thị số (Giao dịch: lọc bằng hàng chip); có thì chạm một nửa để danh sách chỉ còn chiều đó (nửa đó nền xám, nửa kia mờ đi), chạm lại để bỏ (Vay nợ). `FlowTilesSkeleton` cho màn tải |

Danh sách nằm ở `components/settings-list.tsx`. `SettingsGroup` là nhóm dòng trong một thẻ
(`size="lg"` cho trang dạng bảng tin), tiêu đề nhóm là nhãn 12 in hoa giãn chữ như list nhóm của
iOS ("HÔM NAY", "CHUNG"; `groupCaptionClassName`, dùng chung cho `FormSection` và bộ lọc); đường kẻ giữa các dòng thụt 16 vào từ hai bên. `SettingsRow` là **mọi** dòng list (cài đặt, giao dịch, nhiệm vụ…), nên các list đồng nhất: cao 64
(tiêu đề và mô tả mỗi thứ một dòng, cắt bằng "…"; `fullDescription` cho chữ mà dòng tồn tại để hiện: ghi chú trong chi tiết tài khoản, khoản vay, giao dịch, câu trả lời của máy tính lương, thông báo; dòng đó cao hơn 64), lề ngang 16, `icon` tự đặt trong `IconTile` cỡ `sm` (36,
bo 12) màu theo `tone` (xám nếu không truyền), tiêu đề 14 (Body, đậm 500), mô tả 12 (Caption), rồi giá trị, công tắc, số
tiền hoặc mũi tên ở bên phải. `media` cho avatar và logo tài khoản (`AccountLogo`: ô vuông bo 10 cỡ 36 như `IconTile sm`, logo trên nền trắng, tiền mặt là tờ tiền xanh; `size="xs"` 20 trong select). `swipeAction` cho dòng vuốt để xoá. Dòng ở
trang Cài đặt mỗi mục một `tone`, như mockup. `SettingsGroup stickyCaption`: tiêu đề nhóm bám đỉnh màn khi các dòng cuộn dưới nó, tới khi tiêu đề nhóm sau đẩy đi, như list iOS (các ngày ở Giao dịch); nền màu trang hơi trong và mờ phía sau, trên điện thoại trải hết bề ngang; desktop bám dưới thanh trên 64px. `SettingsGroup collapsible`: nhóm ẩn dòng tới khi cần (khoản đã tất toán, tài khoản ngừng dùng); tiêu đề vẫn thẳng hàng với các nhóm khác, cuối tiêu đề là "Hiện …" / "Ẩn"; thẻ trượt mở và đóng (tức thì khi giảm chuyển động). `footer` cỡ Caption 12. Dòng Vay nợ: bên phải là hạn trả; không có hạn thì lãi suất, hoặc phần trăm đã trả, hoặc "Không hạn trả"; lãi suất hay dự tính đứng trước ghi chú ở mô tả.

Màn tải: `SettingsGroupSkeleton` / `SettingsRowSkeleton` (cùng file) có đúng kích thước nhóm và dòng thật (dòng tiêu đề, bo thẻ, dòng 64, ô 36 hoặc avatar, avatar 48 `avatar-lg` cho hồ sơ, `align="center"` cho dòng như Đăng xuất, đường kẻ thụt, giá trị hay số tiền bên phải). Mỗi `loading.tsx` dựng lại từ chính bố cục của trang (`OverviewLayout`, `TransactionsLayout`, `BudgetLayout`) và các skeleton này, cùng `PageHeaderSkeleton` (tên trang thật; công cụ tròn hay viên thuốc, nút có chữ theo độ rộng), `FlowTilesSkeleton`, `FloatingActionsSkeleton`, nên khung trang không nhảy khi dữ liệu tới. Những khối chỉ có khi có dữ liệu (Nhiệm vụ, Sắp đến hạn, cảnh báo quá hạn) không có chỗ chờ sẵn, nên khi có chúng, phần bên dưới vẫn dời xuống.

Utility `pressable` (trong `globals.css`) cho phản hồi chạm của thẻ và ô bấm được không phải
`Button`. Dòng list bấm được xám đi khi chạm (`active:bg-muted`), phẳng hết bề ngang và cắt theo góc thẻ, ẩn các đường kẻ chạm vào nó, như dòng của iOS (`Item shape="flush"`); từ md, dòng đang mở bên cạnh cũng vậy. Trên màn cảm
ứng, giữ lâu không chọn chữ của giao diện và không mở xem trước liên kết (`globals.css`); ô nhập
và chữ có `select-text` (ghi chú của giao dịch, tài khoản, khoản vay) vẫn chọn được.

## Mẫu màn hình

### Khuôn trang (2026-10-08)

Mọi trang tab theo cùng một thứ tự, như các thiết kế app trên Figma:

1. **Đầu trang** (`PageHeader`): một hàng gọn, tên trang bên trái, công cụ bên phải; cuộn cùng
   trang. Trên điện thoại luôn hiện (không ẩn vì "thanh tab đã gọi tên trang").
2. **Thẻ dẫn đầu:** con số quan trọng nhất của trang, `Card variant="inverse"` (Tổng quan, Tài
   khoản) hoặc `FlowTiles` (Giao dịch, Vay nợ).
3. **Các nhóm:** `Section` (tiêu đề đậm 20) cho nội dung chính của trang bảng tin, `SettingsGroup`
   (nhãn nhỏ in hoa) cho nhóm ngày, nhóm cài đặt, các phần của một list. Không có kiểu tiêu đề
   thứ ba.
4. **Một nút nổi** (`FloatingActions`) cho thao tác chính; list chừa đủ chỗ dưới cùng.

| Trang | Bên trái | Bên phải (điện thoại) | Thẻ dẫn đầu |
|---|---|---|---|
| Tổng quan | avatar, lời chào, tên | chuông | Tài sản ròng (đen) |
| Giao dịch | Giao dịch | tháng (viên thuốc), AI | Tiền vào / Tiền ra |
| Tài khoản | Tài khoản | | Tổng số dư (đen), chia theo loại tài khoản |
| Vay nợ | Vay nợ | người liên hệ | Cần thu / Cần trả |
| Cài đặt | Cài đặt | | Hồ sơ |

Trước khi báo xong một màn mới, kiểm tra:

- Có đầu trang (`PageHeader`) trên điện thoại chưa?
- Chỉ một khối đen lớn (thẻ dẫn đầu) và tối đa một nút nổi?
- Tiêu đề nhóm thuộc một trong hai kiểu?
- Đỏ chỉ dùng cho cảnh báo?
- Nút nổi có đè thứ không cuộn được không? Số tiền dài nhất có ngắt dòng không? (ô hẹp: dùng `Money fit`)

### Các màn khác

- **Trang dạng bảng tin** (Tổng quan): đầu trang, thẻ tài sản ròng (nhãn `CardLabel`, con số
  chính, ba phần chia cột), nhiệm vụ, rồi các `Section`: tháng (chỉ lịch), sắp đến hạn, theo hạng
  mục (biểu đồ tròn, không list), thu và chi theo tháng; cuối cùng lời mời Pro. Các khối cách
  nhau 24px.
- **Trang danh sách** (Giao dịch, Tài khoản, Vay nợ, Cài đặt): đầu trang, thẻ dẫn đầu, rồi các
  `SettingsGroup` có tiêu đề nhóm. Ngày ghi "Hôm nay, 08/10", "Hôm qua, 07/10", rồi "Thứ Ba,
  06/10" (`formatDayLabel`); bên phải tiêu đề ngày là một số ròng của ngày (vào trừ ra, như thẻ
  tổng), xanh khi dương; tiêu đề ngày bám khi cuộn. Ô tìm ở Giao dịch nằm trong `<form
  role="search">`: phím Tìm trên bàn phím ẩn bàn phím (kết quả lọc ngay khi gõ).
- **Lọc và tìm ở Giao dịch** (điện thoại): thẻ Tiền vào / Tiền ra chỉ hiển thị; dưới ô tìm là
  `ChipRow`: chip "Lọc" mở sheet điều kiện khác (tài khoản, hạng mục, số tiền; không có loại),
  vạch chia, rồi Tất cả · Tiền vào · Tiền ra · Chuyển khoản · Vay nợ. Điều kiện của sheet đang
  bật hiện thành chip có × ở hàng dưới. Chạm ô tìm mở màn tìm: đầu trang, thẻ tổng, thanh tab
  và nút + nhường chỗ (`data-hide-tab-bar`), ô tìm lên đầu kèm "Huỷ" (xoá chữ, đóng màn). Khi có
  chữ, kết quả là một list phẳng, mới nhất trước: chữ khớp tô nền `warning/25`, bên phải ghi
  ngày thay giờ (năm khác thì có năm); trên list là "N kết quả trong Tháng 10 · tổng …" và "Tìm
  mọi tháng" (tải mọi giao dịch khi cần, `loadAllTransactionsAction`). Không có kết quả: nói đã
  tìm gì, ở đâu, đang lọc gì, kèm "Bỏ lọc" và "Tìm mọi tháng". Desktop giữ bảng lọc bên trái,
  kết quả tìm cũng là list phẳng như trên.
- **Biểu đồ "Thu và chi theo tháng"** (Tổng quan): không có tooltip nổi; chạm một cột tháng (hoặc
  phím mũi tên, đây là radio group) để chọn, mặc định tháng này; hai dòng trong thẻ ghi "Tháng N"
  và "Thu … Chi …"; cột tháng đang chọn được tô nền nhạt, các cột giữ nguyên màu. Cột chi màu `chart-neutral`, không đỏ. Tháng ghi
  Th5…Th10 để khác thứ trong tuần (T2…CN) của lịch.
- **Cài đặt:** một cột căn trái, tối đa `md:max-w-2xl`, thẳng với tên trang. Thứ tự: hồ sơ, Lượt AI,
  Chung, Thông báo, Ứng dụng, Quản trị (hoặc Nhà phát triển trên dev server), Đăng xuất cuối.
- **Desktop:** phần tử trong cột bám (rail) không co lại (`*:shrink-0`); rail cao hơn cửa sổ thì tự
  cuộn. Tài khoản: rail lùi xuống 32 để thẻ dẫn đầu thẳng với thẻ list; cả trang tối đa 64rem
  (68rem từ xl, `budgetPageClassName`), nên nút ở đầu trang thẳng mép phải với list. Thanh bên: "Finance Tracker" kèm "Beta" chữ mờ trên cùng dòng.
- **Màn gói** (duyệt 2026-10-07, theo màn "Get more Claude"): page sheet nền xám, tiêu đề lớn giữa
  ("Nâng cấp Finance Tracker" / "Bạn đang dùng Pro"); thẻ Pro trước với `ChoiceTiles tone="ai"`
  chọn kỳ (mặc định theo năm), nút `lg` rộng hết, ghi chú nhỏ, rồi đường kẻ và "Mọi thứ của gói
  Free, thêm:"; thẻ Free gọn hơn; cuối là dòng payOS và câu hỏi thường gặp (`Accordion` trong
  `SettingsGroup`). Kết quả thanh toán là `NoticeBanner` ở đầu.
- **Form:** sheet `screen` nền xám với `SheetNavHeader`; các trường gom trong một `FormSection`
  (thẻ trắng, ô nhập xám bên trong), dòng chọn và công tắc trong `SettingsGroup`; một nút `lg`
  rộng hết ở cuối. Không bọc một ô lẻ trong thẻ riêng. Nút quay lại là cách huỷ, không cần nút
  "Huỷ".
