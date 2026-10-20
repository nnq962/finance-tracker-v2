# Hệ thống thiết kế

Timi trông và cảm giác như một app iOS/Android thật. Hệ thống được chốt ngày
2026-10-07, theo mockup "Mobile Finance Dashboard Design" (Figma Make: bảng tin và trang "Thư viện
UI") mà người dùng đã duyệt. Mockup và ảnh mẫu không còn giữ trong repo: trang `/design` là bản
chuẩn duy nhất.

- **Xem trực tiếp:** trang `/design` (dòng "Thiết kế" trong Cài đặt: nhóm Quản trị trên production, chỉ admin; ai cũng thấy trên dev server), dựng
  theo trang "Thư viện UI" của mockup: 14 nhóm đánh số, hàng chip mục lục bám khi cuộn. Ở đó
  có mọi token và khối, đủ sáng lẫn tối. Đó là nguồn chuẩn: trang nào cũng ghép từ những gì
  có ở đó.
- **Bảng màu chi tiết:** [`colors.md`](colors.md).
- **Quy tắc làm việc:** [`web/AGENTS.md`](../../web/AGENTS.md).

shadcn/ui chỉ cung cấp phần **hành vi** (focus, bàn phím, ARIA, portal, định vị; Radix ở dưới).
Phần **diện mạo** nằm trong `components/ui` và đã được may lại theo hệ thống này. Sửa một
component ở đó là cả app đổi theo.

## Nguyên tắc

1. **Thẻ trắng nổi trên nền trắng** (2026-10-20). Trang trắng; thẻ trắng bo 20 (24 ở trang tổng hợp), không viền, nổi nhờ
   bóng menu trong kit iOS 26 của Apple (`--card-shadow: 0 8px 40px` đen 12%, như tab bar; không vòng viền mảnh, vì trông như
   viền; theme tối dùng cùng bóng đó, thẻ `#1c1c1e` trên nền đen tự nổi). Sheet cũng trắng từ 2026-10-21 (`--sheet`, utility `surface-sheet`): nhóm dòng và thẻ trong sheet nổi bằng cùng bóng, ô nhập xám nhạt như trên trang; trước đó sheet giữ xám `#f2f2f7`.
   Trước đó trang là `#f2f2f7` với thẻ không bóng (2026-10-18), `#f7f7f8` thẻ bóng rất mờ (6.17–6.21), kem ấm `#f5f4f0`.
   `muted`, rãnh `track` và đường kẻ `separator` cùng sắc xám lạnh, đậm dần. Xám trên thẻ là thang `neutral` của
   Tailwind (không ngả xanh). Theme tối theo iOS (2026-10-16): nền đen `#000`, thẻ `#1c1c1e`, ô mờ / thẻ đen nổi `#2c2c2e`, đường kẻ `#38383a` (trước là `#0a0a0a` / `#171717`).
2. **Một khuôn trang** (2026-10-08). Mọi trang mở đầu giống nhau: một hàng gọn, tên trang bên
   trái, công cụ bên phải (`PageHeader`); rồi một thẻ dẫn đầu, rồi các nhóm. Học một trang là đoán
   được các trang khác. Xem "Khuôn trang" bên dưới.
3. **Một mảng đen.** `neutral-900` cho nút chính, nút nổi, chip đang chọn, công tắc bật (tới
   2026-10-19 cả thẻ dẫn đầu, `Card variant="inverse"`; từ tối hôm đó thẻ dẫn đầu là thẻ thường,
   xem "Khuôn trang"). Mỗi màn chỉ một khối đen lớn: thanh tab, segmented control, lời mời Pro
   đều sáng.
4. **Chữ rõ thứ bậc.** Số tiền của thẻ dẫn đầu là chữ lớn nhất màn; tên trang 24, số tiền và
   tiêu đề đậm 600, chữ thường 400.
5. **Màu dịu, có ý nghĩa.** `income` tiền vào (xanh lá biển `#2e8b57`), `expense` tiền ra (đỏ dịu `#d9534f`; đổi 2026-10-10, `destructive` của chữ xoá và lỗi dùng cùng màu; nền đỏ đặc dưới chữ trắng (nút Xoá, ô xoá khi vuốt dòng) là `destructive-fill`, ở theme sáng cùng màu, ở theme tối đậm hơn `#cf4040` để chữ trắng đọc được, 2026-10-18), `transfer`
   chuyển khoản (sky), `ai` AI và Pro, cũng là điểm nhấn duy nhất của app (xanh chanh `#d4f25a`, 2026-10-09: chỉ làm nền với chữ mực `ai-foreground`, hoặc nằm trên màu đen: chip con số ở thẻ dẫn đầu, tab đang mở, nhãn Pro; chữ và icon màu AI trên nền sáng dùng `ai-strong`, xanh chanh đậm; theme tối `ai-strong` chính là xanh chanh; icon AI trên nút `primary` (nút ✦ cạnh thanh tab, "Hỏi AI") dùng `ai-on-primary`: xanh chanh trên nút đen, theme tối nút trắng thì xanh chanh đậm của logo `#7FA300`), `warning` nhắc nhở (amber). Ô icon dùng màu
   đó (hay màu hạng mục) đã làm dịu về xám, icon màu mực (`tile-tinted`), để list không thành cầu
   vồng. Số tiền: chỉ tiền vào có màu; tiền chi, chuyển khoản để màu chữ thường. Đỏ chỉ để cảnh
   báo thật: quá hạn, số dư âm.
6. **Vừa ngón tay.** Thứ bấm được cao từ 44px. Mọi nút là viên thuốc. Chạm thì hơi lún
   (thu nhỏ 0.97), tắt khi người dùng giảm chuyển động.
7. **Ít chữ.** Nhãn, mô tả, thông báo ngắn và dễ hiểu, giọng trung tính ("Thêm tài khoản", không
   "Chỉ cần…", "Ví dụ…"). Mô tả dưới dòng chỉ ghi điều tiêu đề chưa nói hoặc điều cần làm trước.
   Một thứ gọi một tên trong cả app: "hạng mục", "lượt AI".
8. **Nút xoá không đứng cạnh nút khác kiểu** (2026-10-09). Sheet không có nút ở chân (chi tiết giao
   dịch, chi tiết tài khoản): dòng "Xoá …" đỏ ở cuối nội dung, như cuối trang Cài đặt iOS. Sheet
   chi tiết có nút hành động ở chân (chi tiết khoản nợ, "Ghi nhận thu"): không đặt xoá ở cuối mà
   đưa vào sheet sửa (bút chì), như Danh bạ iOS. Sheet sửa / form có nút Lưu ở chân: xoá là nút
   "🗑 Xoá" có chữ `Button variant="destructive"` rộng 120 (`w-30 px-0`; đỏ đặc `destructive-fill`, chữ trắng `destructive-foreground`, 2026-10-16, trước là nền đỏ nhạt nhìn mờ) đứng bên trái nút
   Lưu trên cùng hàng, cả hai cỡ thường cao 44, Lưu giãn hết phần còn lại (2026-10-16: nút tròn chỉ có icon khó bấm;
   thử cao 56 thì to quá). Xoá luôn có hoàn tác, không hộp xác nhận. Ngoại lệ duy nhất là "Xoá toàn bộ dữ
   liệu" ở Cài đặt: không hoàn tác được nên phải gõ XOÁ (xem Cài đặt bên dưới).

## Nền tảng

| | Giá trị |
|---|---|
| Font | Manrope (từ 2026-10-09, thay Be Vietnam Pro), font biến thiên; mỗi mức đậm nặng hơn 100 so với tên (`font-normal` 500, `medium` 600, `semibold` 700, `bold` 800, trong `globals.css`) vì Manrope vẽ mảnh; số tiền `tabular-nums` |
| Cỡ chữ | Tên trang 24 (đổi 2026-10-08: đầu trang gọn kiểu app ngân hàng, thay tiêu đề lớn 28) · Nhãn 12 in hoa giãn chữ, đậm 600 (tiêu đề nhóm list) · Title 16 (tiêu đề phần ở trang dạng bảng tin, như Headline của iOS; đổi 2026-10-09 từ 20 xuống 18 rồi 16, vì Manrope đậm và rộng hơn) · Headline 16 (tiêu đề thẻ, hộp thoại, trạng thái trống) · Body 14 (nội dung, dòng list, nút, nhãn ô) · Caption 12 (mô tả dòng, lỗi và ghi chú dưới ô). Số tiền lớn 34; chữ trong ô nhập 16 để iOS không phóng to |
| Độ đậm | Số tiền, tiêu đề (trang, nhóm, thẻ, hộp thoại, sheet), nút và con số lớn 600 (`font-semibold`); tiêu đề dòng list, segmented, nhãn ô 500; chữ thường 400 |
| Màu chữ phụ | `muted-foreground` như secondary label của iOS: `#858585` theme sáng, `#929292` theme tối (đổi 2026-10-07 từ `#a1a1a1` / `#737373`, quá nhạt). Làm mịn nét `antialiased` chỉ ở theme tối |
| Bo góc | 32 đầu sheet đáy · 28 đầu sheet `bottom` · 24 thẻ lớn (`size="lg"`), action sheet · 20 thẻ, nhóm danh sách, hộp thoại, menu · 16 thẻ nhỏ, banner, ô icon lớn, ô OTP · 12 ô nhập, select, ô tháng · 10 ô icon trong dòng · tròn cho nút, chip, badge, công tắc (đổi 2026-10-07: thẻ từ 28 xuống 20, ô nhập từ viên thuốc 48 xuống 44 bo 12, như list của app Claude) |
| Chiều cao điều khiển | Nút: L 56 · M 44 (mặc định) · S 36 · nút nổi chính 60 (`size="fab"`) · ô nhập, select, thanh tìm kiếm 44, cùng cao với nút mặc định · segmented 44 (lựa chọn 36) · nút tròn icon 44 · công tắc 52×32 |
| Khoảng cách | Bội của 4. Lề trang 16 (24 từ md) · giữa các phần của trang và các nhóm list 24 (32 từ md; `Page` và layout trang tự lo) · tiêu đề → nội dung 8 · các thứ trong một phần 12 (thẻ cạnh thẻ, segmented → list) · đệm thẻ 16 `sm`, 20, 24 `lg`. Tiêu đề luôn gần nội dung của nó hơn phần phía trên: với `Section` thấy ~16 dưới tiêu đề, ~32 trên |
| Bóng | Thẻ không bóng; chỉ lớp nổi (menu, sheet, hộp thoại, tab bar, nút nổi) có bóng |
| Chuyển động | 150–250ms ease-out; chỉ báo trượt (segmented, công tắc) nảy nhẹ ~450ms. Dùng CSS transition trên `translate`/`opacity` hoặc `motion` cho chiều cao, không dùng layout animation hay transition `grid-template-rows` (giật trên iOS Safari). Khi `prefers-reduced-motion`, rút còn 150ms ease-out, không nảy, thay vì tắt hẳn |

## Component (`components/ui`, đã may lại)

- **Button:** viên thuốc. Kiểu `default` (đen; hover là một lớp phủ sáng 15% hiện dần chứ không đổi màu nền: nền đổi màu cạnh sóng âm vẽ lại mỗi khung hình bị nháy trên Chrome, 2026-10-11), `secondary` (xám), `outline` (nền màu thẻ, không viền: trắng trên nền sáng, xám nổi trên nền tối; bỏ viền 2026-10-09),
  `ghost`, `destructive` (đỏ đặc `destructive-fill`, chữ trắng), `link`. Cỡ: `lg` 56 · mặc định 44 · `sm` 36
  (thêm `xs` 32); `icon` 44, `icon-sm` 36, `icon-xs` 32, `icon-lg` 48, `fab` 60. Icon trong nút
  18px; nút tắt mờ còn 35%.
- **Card:** bo 20, đệm 20 · `size="lg"` (bo 24, đệm 24) cho thẻ chính của trang ·
  `size="sm"` (bo 16, đệm 16). Nhãn trong thẻ (`CardLabel`): chữ thường 14px màu phụ, như "Tài
  sản ròng". `variant="inverse"`: thẻ đen (theme tối: trắng chữ mực, token `inverse`) cho trang
  giới thiệu, đăng nhập và màn chào; là thẻ dẫn đầu của mọi trang từ 2026-10-09 tới tối 2026-10-19
  (ngày cuối: theme tối trắng, người dùng thấy loá), nay thẻ dẫn đầu là `Card` thường.
  `variant="pastel"` (2026-10-18): các đốm lime, bạc hà, xanh trời hoà trên nền trắng (token `--pastel-*`), chữ mực, viền mảnh và bóng mềm (`shadow-pastel`);
  theme tối cùng kiểu đốm, đậm, trên xám thẻ. `blend` chọn bố cục đốm (`net`, `balance`, `flow`, `debts`, `profile`, mỗi cái một utility `bg-pastel-*`).
  **Không còn trang nào dùng** (2026-10-19): cả năm thẻ dẫn đầu thử họ pastel trong 6.22.0, người dùng thấy loè loẹt và chọn thẻ `inverse` cho tất cả
  (6.22.1); giữ lại trong catalog. Ô bên trong trắng mờ 55% có viền mảnh (`bg-pastel-tile`, `--pastel-tile-edge`); `StatGroup` trên thẻ pastel là các ô đó như trên `inverse`
  phụ màu `muted-foreground`; chữ "Free" dùng `Badge variant="soft"`; avatar `accent` trong thẻ này
  là nền mực chữ lime (theme sáng). Từ tối 2026-10-19 không thẻ dẫn đầu nào là `inverse` hay `pastel`.
  `asChild`: thẻ là phần tử con, như một nút cho thẻ bấm cả khối (thẻ Thu / Chi ở Giao
  dịch, đang chọn thì `inverse`).
- **Input, Textarea, InputGroup, Select, Combobox:** chữ 16px (để iOS không phóng to). Cao 44 và
  bo 12, cùng cao với nút mặc định, trong form cũng như đứng riêng (thanh tìm kiếm); `Textarea` và
  `InlineSelect` khi cao lên vẫn giữ góc 12. Khi focus, ô chuyển nền trắng (màu thẻ) và có viền đậm
  2px màu nhấn; khi lỗi, viền 2px màu `destructive`. Kích thước đặt qua biến `--control-h`,
  `--control-radius`, `--control-px` (mặc định 44, 12, 16). `CurrencyInput` (mọi ô số tiền): bàn phím số, nhóm hàng nghìn khi gõ (1.250.000), trong ô chỉ có con số (nhãn đã nói là tiền; không icon, không "đ"); khi đã có số thì nút ✕ ở cuối xoá nhanh, giữ bàn phím; ô có thể âm (`onNegativeChange`) có nút +/− ở đầu. `variant="hero"`: số tiền chính của màn (sheet thêm giao dịch): số 40 đậm ở giữa, không khung, dấu `sign` (− chi, + thu) trước và "đ" mờ sau, ô rộng đúng bằng số nhờ một bản sao vô hình của chữ cùng ô lưới (không ước lượng, nên Safari không cuộn số lệch sau khi gõ), chữ nhỏ dần khi số dài (40 → 30 → 22); khi có số, nút ⊗ xám nhỏ ở mép phải hàng (vùng chạm 44, không đặt sau "đ" để số không lệch tâm) xoá về 0 và giữ bàn phím, gợi ý canh giữa; `tone="income"` tô xanh. Hero có thể âm (`onNegativeChange`, số dư tài khoản): không có nút +/− mà dấu do nơi dùng đặt (công tắc "Số dư âm"), số hiện "−" và màu `expense`, ô ẩn gửi số có dấu. Dưới ô luôn có chip gợi ý (`suggestions`, mặc định bật, `false` để tắt): gõ 3 thì 3.000đ, 30.000đ, 300.000đ…; truyền `history` (số tiền cũ, mới nhất trước) thì ô trống gợi ý các số hay dùng và số cũ khớp chữ số lên trước. Gợi ý theo số đã gõ, không theo số vừa chọn, nên chọn một chip thì hàng đứng yên và chip đó được tô; form đặt lại giá trị (mở lại sheet) thì gợi ý cũng xoá. `variant="inline"`: số tiền gõ tại chỗ trên dòng (`SettingsFieldRow`), như `InlineInput` có "đ" liền sau số; không gợi ý, không ✕. Lỗi dưới một cặp ô (Từ / Đến) cách ô 8px như lỗi dưới một ô. `InputGroup variant="search"`: ô tìm kiếm đứng riêng (trang Giao dịch), tròn như nút
  và không đổi nền, không viền khi focus.
- **Màu ô nhập theo bề mặt** (token `field`, `track`, `segment` và utility `surface-grouped` / `surface-sheet` / `surface-plain`
  trong `globals.css`): trên nền trắng của trang chúng xám nhạt; trên nền xám của sheet ô nhập, chip, nút phụ màu trắng; trên thẻ
  trắng chúng màu xám. Thẻ tự đặt `surface-plain`, khung trang đặt `surface-grouped`, sheet đặt `surface-sheet` (kèm `--background` xám, nên thứ tô màu nền như tiêu đề nhóm bám khi cuộn cũng xám theo). Trong `SelectContent`, các `SelectItem` luôn nằm trong
  `SelectGroup` (kèm `SelectLabel` nếu nhóm có tên), như shadcn hướng dẫn; danh sách tài khoản
  dùng `AccountSelectGroups`.
- **Tabs:** `variant="segmented"` (2026-10-20): kiểu nhẹ của iOS, viên trắng có bóng mềm trên rãnh xám, chữ chọn màu mực; dùng trong thẻ, trên dữ liệu (Chi tiêu | Thu nhập ở Tổng quan). Mặc định là segmented control, viên thuốc cao 44 (lựa chọn 36; đổi 2026-10-09 từ 52). Từ 2026-10-19 (mẫu B của mockup
  segmented): lựa chọn đang chọn là viên đen chữ trắng, đậm, như chip đang chọn, trượt trên rãnh `segment`: trắng (màu thẻ)
  trên nền xám của trang hay sheet, xám nhạt `#f5f5f5` trong thẻ trắng. Theme tối: viên trắng chữ đen trên rãnh màu thẻ
  (trắng 6% trong thẻ). Rãnh có token riêng vì `track` vẫn là nền của skeleton, thanh trượt và toggle group icon. Trước đó:
  viên trắng có bóng nhẹ trên rãnh xám `track`. Dùng cho 2–4 chế độ cùng loại (Chi/Thu/Chuyển). `variant="line"`: tab gạch chân,
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
- **Progress:** thanh dày 8, màu mực (trắng ở theme tối) trên rãnh xám, kể cả lượt AI ở Cài đặt (2026-10-09: bỏ `tone="ai"`). **Empty:** icon mảnh trong ô 80 bo 20 nền `field` theo bề mặt (trắng trên nền xám của trang, sheet; xám trên thẻ trắng), tiêu đề 16. Đồng hồ lượt AI ghi "Còn N/M", nên thanh đầy là chưa dùng.
- **Skeleton:** nền theo bề mặt (`track`): đậm hơn nền xám của trang, xám rất nhạt trên thẻ trắng, sáng 15% trên thẻ dẫn đầu. Không truyền `bg-*` ở nơi dùng. Ngừng nhấp nháy khi giảm chuyển động.
- **Badge:** viên thuốc cao 24 có chấm màu ở đầu; kiểu màu ý nghĩa `income`, `expense`,
  `transfer`, `ai`, `warning`. `count` là số trên vai icon như trên icon app (chuông thông báo):
  viên tròn 18, chữ 10 đậm, màu mực của app (đen; trắng ở theme tối), không đỏ vì đỏ dành cho
  cảnh báo; viền 2px màu nền trang cắt nó khỏi icon và nút tròn. Đặt từ ngay phải tâm icon
  (`top-1 left-[calc(50%+4px)]`) để "9+" nở ra ngoài; quá 9 ghi "9+".
- **Sheet:**
  - Form và màn chi tiết dùng `PageSheet` (xem bảng khối), không dùng `Sheet` trực tiếp
    (đổi 2026-10-08: mọi sheet của app chuyển sang `PageSheet`).
  - `variant="screen"`: một màn hình đẩy từ phải, phủ cả điện thoại; chỉ còn màn chào mừng lần
    đầu dùng, kèm `SheetNavHeader`.
  - `variant="bottom"`: thẻ trồi từ đáy, bo 28, có thanh kéo, nền xám để nhóm dòng trắng nổi
    lên. Dùng cho lựa chọn ngắn và hành động.
- **Drawer mặc định (sheet đáy):** như half sheet của mockup: sát hai mép, đầu bo 32, thanh kéo
  40×6 `neutral-200`, nội dung căn trái.
- **Drawer `variant="page"` (page sheet iOS):** trồi lên tới ngay dưới status bar, đầu bo 28, kéo
  xuống để đóng; từ `sm` là tấm giữa màn hình, rộng tối đa 32rem. Từ `md` (desktop, có thanh bên;
  2026-10-18) là panel nổi bên phải: rộng 440, cách mép cửa sổ 12, bo 24 cả bốn góc, trượt vào từ phải
  trên lớp phủ nhạt hơn (đen 20%), không có thanh kéo và không kéo để đóng (đóng bằng ✕, Esc hay bấm ra
  ngoài); thanh trên giữ như điện thoại. Sheet mở chồng lên sheet nằm đúng chỗ panel trước. Không dùng
  thẳng: dùng qua khối `PageSheet`.
- **Soát catalog 2026-10-21 (Impeccable + Make Interfaces Feel Better):** nút `outline` có viền mảnh bên trong (`separator`);
  token chữ `warning-text` / `destructive-text` (đủ 4,5:1 trên nền trắng) cho mọi chữ cam, đỏ, còn `warning` / `destructive` cho nền;
  nút `xs`, `icon-sm`, `icon-xs`, chip `Toggle` 40/36, nút ✕ trên chip, `InputGroupButton xs` kéo vùng chạm tới 44 bằng `after:`;
  `SelectItem` cao 44, bo 14; segmented icon (`ToggleGroup variant="segmented"`) cùng dáng viên thuốc 44 với Tabs; chữ tab một độ đậm;
  công tắc 400ms nảy nhẹ, màu nền 200ms; ô con trong thẻ bo 16 (`StatGroup`, `ChoiceTiles`, `IconTile lg`); `PickGrid` ô bo 12;
  banner bo 20 và thẻ trắng có bóng (`PromoBanner`, `NoticeBanner` trên thẻ, `PushBanner`, `PickGrid`); `Carousel` chừa chỗ cho bóng;
  vạch ngăn list nằm trên nền dòng (dòng vuốt để xoá không còn mất vạch); nhóm `lg` (thẻ trang tổng hợp): dòng nhập, skeleton, tiêu đề
  nhóm và chú thích đều lề 24; `ChipRow` trong thẻ chạy tới mép thẻ (`--chip-row-bleed`); bóng nút nổi là token `--float-shadow`;
  viền checkbox, radio `foreground/35`; focus của thanh trượt, thước, bánh xe, ô tiền, stepper, sao là viền mực 2px.
- **Status bar:** màu cố định bằng màu nền trang (`components/pwa-theme-color.tsx`). Web không
  đổi được màu status bar mượt theo chuyển động: Safari 26 bỏ qua `theme-color`, tô thanh theo
  `background-color`/`backdrop-filter` của phần tử `fixed` sát mép trên, và chỉ lấy màu mới khi
  hiệu ứng đã xong (đã thử trên iPhone 2026-10-09: đổi màu từng khung hình, mỗi giây, kèm cuộn 1px
  đều không tới thanh). Nên lớp phủ tối (Drawer, Sheet, Dialog, AlertDialog) đặt lớp tối (không blur từ 2026-10-09: blur dưới lớp đang hiện dần chỉ hiện khi hiện xong, nên trang tối rồi mới nhoè; như drawer gốc của shadcn, đen 50%) ở
  `::before`, không ở chính lớp `fixed` (không thì thanh chuyển trắng), và `PageSheet` phủ kín
  màn hình trên điện thoại: khi sheet lên hết, thanh lấy màu của sheet, mà sheet trắng trùng màu
  trang nên thanh không đổi. Từ 2026-10-21 lớp phủ (đen 40% ở mọi sheet và hộp thoại) phủ kín cả
  màn, kể cả dải dưới status bar: dải 8px để trống trước đây (để Safari không lấy trúng lớp phủ)
  không cần nữa khi trang và sheet cùng trắng. Sheet bỏ `will-change` của vaul. Sheet ngắn và hộp thoại không tới mép trên nên thanh có thể đổi sang
  màu trang đã phủ tối sau khi lớp phủ hiện xong. Phần tử `fixed` mới chạm mép trên cũng đặt nền ở
  `::before`, trừ khi nó cố ý mang màu cho thanh.
- **Toast (Sonner, `components/ui/sonner.tsx`):** thẻ trắng ở giữa phía trên (2026-10-17, thay đảo đen
  của 2026-10-09): nền `card` ở theme sáng, xám nổi `secondary` (#2c2c2e) ở theme tối, nổi khỏi trang bằng
  viền mảnh và bóng `shadow-toast` (chỉ đổ xuống, không chạm thanh trạng thái). Mọi loại cùng một cỡ, cỡ của đảo cũ (giữ lại
  2026-10-17 sau một ngày thử cao 52): cao 64, rộng hết màn trừ 16 mỗi bên trên điện thoại, 400 trên màn rộng, bo 20. Trạng thái nằm trong ô 32 (bo 10) tô
  nhạt màu ý nghĩa: thành công `income`, lỗi `expense`, cảnh báo `warning`, thông tin `transfer`, đang tải xám;
  tiêu đề đậm tối đa hai dòng, hoặc một dòng trên một dòng mô tả xám, cắt bằng "…", nên toast không bao giờ
  cao lên; nút Hoàn tác là nút `primary` cao 36 bo 12, cách mép phải 14 bằng khoảng cách tới mép trên và dưới. Khi xếp chồng, toast
  phía sau chỉ lộ mép, không lộ chữ. Sonner vẫn lo hiệu ứng trượt, xếp chồng, vuốt để đóng, hẹn giờ. Toast
  luôn ở đầu màn hình, kể cả khi một `PageSheet` đang mở (che nút ✕ trong vài giây; bỏ luật hạ toast xuống dưới
  thanh sheet của 6.15.6); chạm vào toast không đóng sheet.
- **Dialog, AlertDialog:** bo 20. Chỉ để xác nhận hoặc nhập rất ngắn; nút huỷ màu xám.
- **DropdownMenu, Select, Combobox (danh sách):** bo 20, dòng cao 40.

## Khối kiểu app (`components/app`)

| Khối | Dùng khi |
|---|---|
| `Section` | Một phần có tiêu đề ngoài thẻ (`SectionHeader`: 16px, đậm vừa, kèm ghi chú và "Xem tất cả ›" (đậm vừa, `foreground/70`, có mũi tên, vùng chạm 44) hoặc nút); nội dung cách tiêu đề 8, các thứ bên trong cách nhau 12. Phần có tiêu đề lớn luôn dùng nó |
| `Money` | Mọi số tiền: chữ số đều, "đ" viết liền sau số (55.103.000đ); ở cỡ lớn (`lg`, `xl`) "đ" nhỏ hơn và mờ 50% như mockup; cỡ `sm` 14 / `md` 16 / `lg` 20 / `xl` 34 / `display` (34 trên điện thoại, 44 từ md; chỉ cho con số dẫn đầu trang, Tài sản ròng ở Tổng quan, 2026-10-20), màu theo `tone` (`muted` cho số không được tính, như số dư tài khoản "Không tính vào báo cáo"). Số âm luôn viết bằng dấu trừ "−", không phải gạch nối, cả ở `formatCurrency` và `formatCompactCurrency`. `fit`: cho ô hẹp có độ rộng cố định (FlowTiles): số luôn một dòng, co theo `@container` gần nhất từ cỡ của nó xuống 3/4 (lg: 20 → 15), vẫn không vừa thì viết gọn (+125tr, −1,25tỷ); luôn chỉ một dạng hiện, số đầy đủ cho trình đọc màn hình và tooltip. Trình duyệt không có `round()` hay `cqi` (iOS 15, Chromium cũ) thì chỉ hiện số đầy đủ. Manrope có chữ số đều (`tnum`), nên các chữ số của số tiền rộng bằng nhau |
| `IconTile` | Icon trên ô vuông bo góc nền nhạt (như mockup); màu hạng mục hoặc màu ý nghĩa, làm dịu về xám với icon màu mực (`tile-tinted`, 2026-10-08). Dòng không mang ý nghĩa màu (Cài đặt) dùng `neutral` mặc định: ô xám, icon mực (2026-10-09); màu chỉ khi là dữ liệu (hạng mục, tài khoản) hay ý nghĩa (Pro `ai`). Cỡ `xs` 20 (bo 6) đứng trước giá trị ở cuối dòng, ngang `AccountLogo xs`; Cỡ `sm` 36 (mọi dòng list, qua `SettingsRow`), `md` 40 (bo 10), `lg` 48 (bo 16; đầu thẻ, đầu sheet); `shape="circle"` chỉ cho chữ cái, khuôn mặt. Tông `card` (2026-10-12): ô trắng viền mảnh, thay `neutral` ở chỗ ô có thể nằm trên nền xám (dòng trong list `bg-field`, ô đang chọn của lưới), nơi ô xám biến mất. `badge`: một chữ ngắn ở góc trên phải như trên icon app ("Mới" cho hạng mục sẽ được tạo), nền xanh chanh `ai`, viền màu thẻ, chỉ nhô ra 6px để không chạm chữ bên cạnh hay bên dưới; dùng trên ô `card` hoặc ô màu hạng mục, không trên ô `ai` (khó đọc) |
| `DeltaBadge` | % thay đổi so với kỳ trước, dạng chữ nhỏ có mũi tên ("↘ 93%") như mockup, không nền; xanh khi tốt, đỏ khi xấu |
| `StatGroup` + `Stat` | 2–4 chỉ số chia cột bằng vạch mảnh; `tiles` (thẻ dẫn đầu, 2026-10-19): mỗi chỉ số một ô `track` bo 16 cách 8, không vạch (trên thẻ `inverse` / `pastel` ô trắng mờ); `href` cho cột mở trang (link thật, bấm được cả khi JS chưa tải xong), `onClick` cho việc tại chỗ |
| `BotIcon` | Gương mặt của Timi (2026-10-11, theo Bot của lucide-animated): SVG như icon Lucide (đặt trong nút, ô icon như mọi icon), hai mắt chớp bằng CSS (co thành chấm rồi mở): `hover` khi rê/chạm nút chứa nó (`group/button`), `once` khi hiện ra, `loop` chớp đôi thỉnh thoảng khi đang nghĩ. Dùng cho mọi chỗ là trợ lý (nút cạnh thanh tab, Hỏi AI, nhãn Timi, dòng đang nghĩ); ✦ `Sparkles` vẫn là ký hiệu của gói Pro và lượt AI. Giảm chuyển động: mắt đứng yên |
| `VoiceWave` | Giọng nói khi đang ghi âm, như app Ghi âm của iPhone (chọn 2026-10-11): thanh mảnh 3px màu mực, đủ số thanh lấp kín bề ngang, trôi đều từ phải sang trái theo từng khung hình (không nhảy từng nấc); mỗi thanh là mức âm thanh của một lúc (70ms), thanh mới nhất mọc ra ở mép phải và cao thấp theo giọng lúc đó; phía trái mờ dần (mask, đặt trên nền nào cũng được); vẽ trong khung riêng (`contain: paint`) để không kéo nút bên cạnh vẽ lại theo. `level` là hàm trả mức 0–1, đọc mỗi khung hình; thanh được vẽ thẳng lên trang, không qua React. Trong trợ lý AI nó thay dòng "Đang nghe…" khi ghi âm gửi lên máy chủ. Giảm chuyển động: thanh đứng yên, cả hàng chỉ sáng lên theo giọng |
| `ProgressRing` | Tiến độ dạng vòng mảnh có số ở giữa; cỡ `xs` 44 (dòng nhiệm vụ đã gọn), `sm` 64, `md` 112. Hiện ngay giá trị (2026-10-20: bỏ cảnh quét 0,9 giây mỗi lần mở trang, tốn chú ý và dễ nuốt lần chạm trên iOS); đổi giá trị thì cung chạy tới giá trị mới trong 0,5 giây. Giảm chuyển động: hiện ngay |
| `LimitBar` | Đã dùng so với một hạn mức (2026-10-16): thanh trơn như Thời gian sử dụng của iOS, không vạch mốc hay lớp "kế hoạch" (đã thử khía, tam giác, hai tông, chấm, lớp được chi, vòng Activity; người dùng chọn thanh trơn). `tone`: `ok` màu mực, `near` amber (từ mốc báo sớm người dùng chọn, 80% hay 90%, mặc định 80%; hay khi chi nhanh hơn kế hoạch), `over` đỏ, đầy thanh khi vượt. `size` `sm` dày 6 (dòng), `md` dày 10 (con số dẫn đầu). `color`: màu hạng mục cho mức `ok` khi nhiều hạng mục đứng cạnh nhau (thẻ Hạn mức ở Tổng quan, 2026-10-20); amber và đỏ vẫn thắng. Thanh chạy tới giá trị trong 500ms (150ms khi giảm chuyển động); `role="progressbar"` |
| `LimitRow` | Dòng của `SettingsGroup` cho một hạn mức (2026-10-16): ô icon, tên và "đã chi / hạn mức" một hàng, `LimitBar` dưới, chú thích dưới thanh ("Còn 580k · 36k/ngày", hay "Vượt 250k" đỏ khi `tone="over"`), mũi tên; cao 76 thay vì 64 vì có thanh |
| `FormSection` | Các trường của một form trong thẻ trắng, có tiêu đề nhỏ, ghi chú và nội dung phụ bên dưới |
| `PromoBanner` | Thẻ sáng cho một điều đáng chú ý, như lời mời Pro (dưới tài sản ròng ở Tổng quan, khi đã xong nhiệm vụ): ô icon `lg` màu `tone` (mặc định `ai`), tiêu đề, một dòng, mũi tên. Sáng để không tranh với thẻ dẫn đầu. Luôn rộng hết chỗ chứa; nơi dùng không đặt độ rộng |
| `FloatingActions` | Nút hành động chính nổi phía trên thanh tab, trên điện thoại; tự chừa một khoảng cuối trang để dòng cuối cuộn lên khỏi nút. `FloatingActionsSkeleton`: nút + đứng sẵn chỗ trong màn tải, không bấm được, để khỏi bật ra khi trang tới |
| `MobileBottomNav` | Thanh tab nổi trên điện thoại (`components/mobile-bottom-nav.tsx`), kiểu iOS 26. Từ 2026-10-20 dựng theo kit Figma iOS 26 của Apple (mẫu H của mockup nav): viên cao 62 cách hai bên 20, nền `tab-bar` (#F7F7F7 92% nhoè nền; theme tối màu thẻ 95%), viền trắng 1px ngoài cùng (tối: trắng 15%), bóng mềm rộng 8↓/40/12% và bóng gần 8↓/15/2%; 5 ô: bốn trang (Tổng quan, Tài khoản, Giao dịch, Vay nợ, `tabIcon` Phosphor Fill trong `lib/app-navigation.ts`, ví và bắt tay 28 còn lại 26 trong ô 28) và Timi ở ô cuối (ngôi sao bốn cánh `RiBardFill`, chạm mở trợ lý, không bao giờ nhận viên); mỗi ô icon trên tên 10/700 (tracking −0,1) cách 1, căn giữa; tab đang mở màu `tab-active` (#0088FF, tối #2B8FF5), các tab khác mực đủ; viên của tab đang mở `tab-pill` (#E6E6E6, tối mực 13%) cao 54 cách mép 4, rộng hơn ô 4; các ô lùi vào 6 nên viên đầu/cuối cách mép 4. Cài đặt rời thanh tab, mở từ avatar ở đầu trang Tổng quan (cạnh chuông), ở /settings không tab nào sáng. Viên thuốc (`card`, 95%, nhoè nền) cao 60, cách hai bên 20 và đáy 20 (hoặc vùng an toàn trừ 12), bóng rộng và mềm, viền mảnh một màu; hai đầu bo liên tục (`lib/smooth-capsule.ts`: nửa hình tròn ở đầu, nối vào cạnh thẳng bằng đường cong có độ cong tăng dần, không còn gợn ở chỗ nối). Viên trượt 350ms tới đúng pixel chẵn (vị trí lẻ pixel bị Safari nắn ở cuối, thành cú giật). Nền, viền và viên là các lớp riêng sau icon, mỗi icon một lớp: để chung, Safari vẽ lại icon khi viên trượt và chúng rung. Mỗi tab nhớ vị trí cuộn (theo URL, kể cả query; trang con như /design, /settings/plan luôn mở ở đầu); chạm lại tab đang mở thì cuộn về đầu (mượt, tức thì khi giảm chuyển động); trượt ngón ra khỏi tab trước khi nhấc thì huỷ |
| `ScreenHeader` | Đầu màn đẩy vào từ trang khác (`components/app/screen-header.tsx`, 2026-10-19, theo màn Apple Account của iOS): Cài đặt trên điện thoại, mở từ avatar ở Tổng quan. Cùng hình học với thanh của sheet (`SheetBar`): cao 52, không đệm trên (khung app đã cách mép an toàn 16), 8 dưới, lưới 44 · tên · 44; nút back `Button secondary icon` có bóng `0 4px 16px 10%`, tên màn 16 đậm ở giữa. Back về trang trước, không có thì về `fallbackHref` (Tổng quan). Từ md Cài đặt là trang trong sidebar nên dùng `PageHeader` như mọi trang |
| `PageHeader` | Đầu mọi trang (`components/page.tsx`), kiểu app ngân hàng Việt Nam (Cake, Timo), chọn 2026-10-08: một hàng cao 44 (64 từ md), cuộn cùng trang (không dính, không thu gọn). Bên trái tên trang 24 đậm 600, hoặc `lead` thay chỗ đó (Tổng quan, từ 2026-10-13: icon app 40 (`TimiIcon`, ô đen ở giao diện sáng, ô trắng ở giao diện tối), tên "Timi" Manrope đậm (`TimiWordmark`, kèm `Badge ai` "Pro" khi có gói) trên lời chào theo giờ, không bấm được; từ md chỉ còn lời chào làm tiêu đề vì thanh bên đã có logo; tên trang vẫn là h1 cho trình đọc màn hình). Bên phải: `tools` (mọi cỡ: tháng, chuông), `accessory` (nút tròn 44, dạng điện thoại của `actions`: dưới md khi có `actions`), `actions` (nút có chữ từ md). Cách nội dung 16 trên điện thoại. `PageHeaderSkeleton` hiện tên trang thật. Số đếm không nằm ở đầu trang mà trong tiêu đề nhóm ("ĐANG DÙNG · 3") |
| `InlineSelect` | Dropdown mở tại chỗ, đẩy nội dung bên dưới xuống: chọn trong vài tài khoản, ví. Hiệu ứng chiều cao đơn giản (300ms ease-out); trên iOS kém mượt hơn transform, đã chấp nhận. Danh sách dài vẫn dùng `Select`/`Combobox` |
| `CardLabel` | Nhãn nhỏ trong thẻ ("Tài sản ròng", "Tiền vào"): chữ thường cỡ Body, màu phụ; trên thẻ `inverse` thì sáng 60%. Mọi thẻ có nhãn dùng nó |
| `Avatar` | Ảnh người dùng, không có ảnh thì chữ cái đầu. `AvatarFallback inverse` cho chính người dùng (Tổng quan, Cài đặt, 2026-10-20): đen chữ trắng, theme tối trắng chữ đen. `AvatarFallback colorKey={id}` cho chữ cái nằm trên màu riêng của người đó (bảng màu hạng mục, trừ hồng và xám; cùng hàm `personTileClassName` với `ContactAvatar`), như hồ sơ ở Cài đặt và Tổng quan; không có thì nền xám |
| `Chip` | Chip tĩnh cho thứ đã chọn hoặc gắn kèm (người, thẻ #): có thể có avatar (hay icon, `media`) và nút ×; `tone="income"` (nền và chữ xanh) cho thứ giúp tiết kiệm, như mã giảm giá đã áp |
| `Collapse` | Thu gọn và mở lại một khối: chiều cao (hoặc rộng, `axis="x"`) trượt về 0 kèm mờ dần trong 300ms, phần bên dưới trôi lên mượt thay vì nhảy; khi đóng vẫn giữ trong cây nhưng `inert`. Dùng cho màn tìm ở Giao dịch (đầu trang và thẻ tổng thu lại, "Huỷ" trượt ra). Tức thì khi giảm chuyển động |
| `ChipRow` | Hàng chip cuộn ngang, chạy tới mép màn (bù `--main-content-px`), chip đầu vẫn thẳng hàng trang; có chừa 4px trên dưới cho viền focus. Đi kèm `ChipButton` (chip mở một thứ, như sheet lọc; `active` tô đậm khi điều kiện đang bật, ghi "Lọc · 2") và `ChipRowDivider` (vạch đứng giữa nút lọc và các chip loại). `ChipButton variant="outline"` (2026-10-12): chip trắng viền mảnh cho chip nằm trên nền xám (thẻ ghi giao dịch của trợ lý), nơi chip xám mặc định biến mất; chip không bao giờ co lại, hàng chip cuộn ngang. Chip chọn là `ToggleGroup` `size="sm"`. Chip đổi màu tức thì, không chuyển màu (chuyển trắng sang đen đi qua xám, và khựng lại thành nháy khi trang đang bận); chip lọc ở Giao dịch hiện chọn ngay rồi mới lọc trang trong transition |
| `SettingsGroup plain` | Nhóm giữ tiêu đề, chú thích và nút Hiện/Thu gọn nhưng không bọc thẻ danh sách, cho một nhóm gồm thẻ (2026-10-12: tài khoản đã khoá trên desktop là thẻ cùng cỡ với tài khoản đang dùng). Tài khoản không tính vào báo cáo vẫn ở nhóm Đang dùng: dòng phụ mở đầu "Ngoài báo cáo", số dư xám; trên thẻ desktop nhãn "Số dư · Ngoài báo cáo" (2026-10-12: đổi từ "Không tính", nghe thiếu chuyên nghiệp; công tắc "Không tính vào báo cáo" như MISA, nhãn ngắn "Ngoài báo cáo") |
| `MonthPickerSheet` | Chọn tháng từ sheet đáy: năm với ‹ ›, lưới 12 tháng, tháng chưa tới mờ đi (`min` cho tháng phía trước như hạn của hũ tiết kiệm: tháng đã qua mờ đi, "Tháng hiện tại" chọn `min`), nút "Tháng hiện tại" (cỡ thường, đen). Từ `sm` mọi sheet đáy (`DrawerContent` hướng bottom) rộng tối đa 512 và căn giữa như `PageSheet`, không trải hết màn máy tính (2026-10-17). Nền xám như mọi sheet (`DrawerContent surface="grouped"`, nay dùng được cả cho sheet đáy ngắn), ô tháng trắng; action sheet thì vẫn là khối trắng nổi trên lớp phủ như iOS |
| `MonthSelect` | Tháng đang xem dạng nút viên thuốc "Tháng 10, 2026 ▾", chạm mở `MonthPickerSheet`; tới tháng nào cũng hai chạm. Một cách đổi tháng duy nhất cho trang có tháng, không kèm mũi tên ‹ ›. `size="bar"`: cao 44 và gọn ("Tháng 10", năm khác thì "Tháng 10/2025") cho đầu trang |
| `Stepper` | Đếm từng bước bằng − / + (số người, số tháng); nút lún 0.96, viền focus mực; số không phóng to mỗi lần bấm |
| `OtpInput` | Mã một lần trong các ô riêng; tự nhảy ô, dán được cả mã |
| `WheelPicker` + `WheelPickerGroup` | Bánh xe cuộn kiểu iOS để chọn giờ, phút. Trong một nhóm dòng thì mở tại chỗ như iOS: dòng ghi giờ "20:00 ⌄" (như `TimeRows`), chạm thì bánh xe trượt mở ngay dưới (`Collapse`), dải chọn thụt 16 như lề dòng; dòng mờ và bánh xe gập khi không đổi được (giờ "Nhắc ghi chi tiêu" khi tắt nhắc) |
| `DateStrip` | Một tuần ngày nằm ngang để chọn một ngày; chấm đánh dấu ngày có việc |
| `RulerSlider` | Thước vạch kéo để chọn giá trị, kim màu mực `primary` (2026-10-21; cam để dành cho "sắp chạm hạn mức") |
| `Rating` | Sao 1–5; mỗi sao chạm 44, sao trống `muted-foreground`, lún 0.96 |
| `SegmentedProgress` | Tiến độ chia đoạn: các bước của một luồng, độ mạnh mật khẩu |
| `StepFlow` | Đi từng bước như onboarding hay hướng dẫn (`components/app/step-flow.tsx`, 2026-10-09): các bước vuốt ngang và bắt từng bước, `PageDots` dưới (chạm để tới), rồi chân: ‹ co giãn vào từ bước hai như "Xoá lọc" ở Bộ lọc (nút chính nhường chỗ), nút chính "Tiếp" mờ đi rồi `doneLabel` hiện lên ở bước cuối và gọi `onDone`. `step` do nơi dùng giữ (về bước đầu mỗi lần mở, ẩn "Bỏ qua" ở bước cuối); bấm nút thì bước đổi ngay, cuộn trong lúc trượt không đổi lại bước (tránh nút co rồi giãn, nhãn nháy), chỉ ngón tay mới đổi. Cho `className="flex-1"` trong một cột thì mỗi bước cao hết chỗ. Dùng cho hướng dẫn cài trên iPhone và màn giới thiệu |
| `Steps` | Các bước có tên nối bằng đường kẻ: xong có ✓, đang làm có viền |
| `PageDots` | Chỉ báo trang; chấm hiện tại kéo dài thành vạch (300ms, không nảy); chấm khác `foreground/25`, cách 12, vùng chạm cao 40 |
| `Carousel` | Thẻ vuốt ngang, bắt từng thẻ, kèm `PageDots` |
| `SwipeRow` | Vuốt trái để lộ một hành động (mặc định Xoá); dùng qua `SettingsRow swipeAction` để dòng vuốt giống mọi dòng khác |
| `PageSheetScreen` | Màn sâu hơn trong một `PageSheet`, mở từ bên trong (danh sách hạng mục, danh sách tài khoản của form giao dịch, chi tiết một hạn mức, một người trong Danh bạ, bảng lương): `<PageSheetScreen open title onBack>` đặt cạnh nội dung của màn đang có, bọc nội dung màn sâu. Từ 2026-10-18 màn sâu được đẩy vào như sheet mở trong sheet (thay cho hook `usePageSheetScreen`, trước đó đổi ngay): trượt vào từ phải, màn cũ bị đẩy ra hẳn bên trái, cùng 0,5 giây ease iOS, mỗi màn lệch 110%; giảm chuyển động thì đổi ngay không trượt. Thanh của nó có ‹ gọi `onBack` và tiêu đề hiện dần; nút phải riêng (`action`, như bút chì sửa một người trong Danh bạ hay sửa hạn mức) và chân riêng (`footer`, như "Xem N giao dịch" ở mọi màn của Bộ lọc) nếu cần; `disabled` khoá ‹ khi đang lưu. Màn dưới vẫn giữ (ẩn sau khi trượt ra) nên những gì đã nhập còn nguyên, chân của nó trượt đi cùng nó; mỗi màn nhớ chỗ đã cuộn, kể cả khi đi sâu nhiều màn rồi quay lại từng bước; màn sâu mở ở đầu. Lúc trượt ra, màn sâu giữ nội dung đã hiện lần cuối, nên nội dung có thể lấy từ state mà `onBack` xoá. Esc lùi một màn. Đóng sheet thì màn sâu đứng yên, đi cùng sheet; mở lại thì về màn đầu. Nền mặc định theo màn mở nó. Màn sâu lồng màn sâu được (Quản lý hạng mục → sửa hạng mục → Biểu tượng; hạn mức → nhóm → giao dịch). Phải đặt trong cây của sheet; ngoài sheet chỉ hiện nội dung khi `open` |
| `SettingsRow checked` | Dòng của list chọn như iOS: ✓ ở cuối khi đang chọn, không có gì khi không, không có mũi tên; chạm là chọn (`onClick`), trình đọc màn hình nghe nút bật/tắt (`aria-pressed`). Dùng cho các màn chọn trong sheet lọc Giao dịch |
| `SettingsFieldRow` | Dòng nhập tại chỗ như cài đặt iOS (cùng file `settings-list.tsx`, 2026-10-08): nhãn bên trái (có thể kèm `icon` và `description` một dòng, như `SettingsRow`), điều khiển ở cuối. Ô gõ là `InlineInput` (`components/forms/inline-input.tsx`): không khung, chữ canh phải, lấp đầy dòng tới nhãn nên chạm đâu cũng gõ được, đơn vị (`unit`: đ, ngày, giờ) mờ sau số, luôn hiện kể cả khi ô trống (chạm vào đơn vị cũng gõ được); tiền dùng `CurrencyInput variant="inline"` ("đ" sau số, hay sau placeholder số "0"; không có sau placeholder bằng chữ như "Như lương gross"). Cũng đặt được `Stepper` (`w-32`) hay chip `ToggleGroup size="sm"`. Điều khiển giữ độ rộng (ô gõ tối thiểu 64), nhãn nhường chỗ, mô tả cắt ở một dòng. `htmlFor` nối nhãn với ô; `collapsed` như `SettingsRow`. Dùng cho máy tính lương, thêm / sửa người ở Danh bạ |
| `SettingsRow unread` | Dòng chưa đọc: chấm `transfer` 12px trên góc phải trên của ô icon như chấm trên icon app, viền 2px màu thẻ cắt nó khỏi ô (dòng không icon: chấm 8px trước tiêu đề), tiêu đề đậm 600; trình đọc màn hình nghe thêm "chưa đọc". Đọc rồi thì như mọi dòng. Dùng cho Thông báo; giờ ở `value` theo `formatMomentLabel` (hôm nay "14:05", "Hôm qua", cũ hơn "05/10"). Thông báo (2026-10-12, `lib/notices`) tính từ dữ liệu thật mỗi lần mở: nợ còn ≤ 3 ngày (`warning`) hay quá hạn (`expense`), hôm qua chưa ghi, thưởng nhiệm vụ chờ nhận, còn ≤ 3 lượt AI, Pro còn ≤ 7 ngày (`ai`), tài khoản âm, bản có tính năng mới (mở danh sách thay đổi ngay trong sheet), tin admin gửi (Tin từ Timi, icon Timi thay ô icon, 30 ngày); nhóm "Mới" là chưa đọc, "Đã xem" là đã đọc; trạng thái đọc lưu trên server |
| `SettingsRow collapsed` | Dòng gập lại (`true`) hay mở ra (`false`): chiều cao trượt trong 300ms và mờ dần, nên các dòng bên dưới dịch dần thay vì nhảy; khi gập thì `inert`. Cho dòng hiện khi người dùng yêu cầu (nhiệm vụ còn lại sau "Xem nhiệm vụ") và dòng rời đi khi xong (nhiệm vụ vừa nhận thưởng). Không truyền với dòng luôn hiện. Đường kẻ tự theo: dòng đầu tiên đang hiện không có kẻ phía trên |
| `ActionSheet` | Danh sách lựa chọn ngắn trồi từ đáy, Huỷ tách riêng bên dưới (vaul). Lớp phủ và action sheet đang đóng (mọi lớp phủ cũng vậy) để cú chạm đi qua, nên bấm lại ngay sau Huỷ không đóng nhầm sheet bên dưới; mỗi lần mở là một bản mới, nên mở lại khi bản cũ đang trượt xuống vẫn được |
| `PushBanner` | Thông báo đẩy như trên màn khoá (`components/app/push-banner.tsx`), để xem trước khi gửi: thẻ bo 16 nền thẻ, bóng nhẹ, icon Timi 36 bo 8, tiêu đề đậm 14 cắt một dòng với "bây giờ" đối diện, nội dung 14 tối đa bốn dòng; ô còn trống thì hiện "Tiêu đề", "Nội dung thông báo". Dùng ở Quản trị › Gửi thông báo |
| `NoticeBanner` | Thông báo trong trang trên nền nhạt theo `tone`, đóng được (`onDismiss`), hoặc bấm cả khối kèm mũi tên để mở thứ nó nói tới (`onClick`), hoặc kèm một nút nhỏ ở cuối cho bước tiếp theo (`action`). `surface="card"`: thẻ trắng như một dòng list (cao 64, bo 20), màu chỉ ở ô icon và tiêu đề, cho cảnh báo nằm giữa các list; khoản quá hạn ở Vay nợ dùng `tone="expense"`, đỏ như chữ "Quá N ngày" ở dòng nợ, thay cho nền be `footer` (2026-10-17): các nút ở một hàng riêng dưới chữ, khi nút là trọng tâm và chữ dài (gợi ý chỉnh hạn mức: "Đặt 3tr" chính, "Để sau" ghost) |
| `StatusScreen`, `ErrorCard` | Màn trạng thái (`components/app/status-screen.tsx`, 2026-10-18). `StatusScreen`: màn riêng bố cục như màn khởi động (`app/loading.tsx`): logo Timi 88 hơi trên giữa (`media` thay được), tiêu đề cỡ lớn, một dòng xám, rồi các nút xếp dọc rộng tới 320; dùng cho trang 404 (`app/not-found.tsx`: "Về Tổng quan" `StatusHomeButton` là link, "Quay lại" `StatusBackButton` ghost, về Tổng quan nếu không có trang trước) và khi cả app gặp sự cố (`app/global-error.tsx`: logo kèm chữ Timi, tiêu đề nhỏ hơn `titleSize="md"` dưới chữ Timi, nút "Tải lại" tải lại cả trang; tự đặt theme tối theo lựa chọn đã lưu vì layout gốc không còn). `ErrorCard`: thẻ `lg` thay nội dung một trang không tải được, trong khung app (thanh tab vẫn còn): ô icon cảnh báo `lg`, "Không tải được …", dòng "Kiểm tra kết nối mạng rồi thử lại. Dữ liệu của bạn không bị ảnh hưởng.", nút "Thử lại" (`retry` của `error.tsx`); các `error.tsx` đặt `PageHeader` của trang phía trên, `app/(main)/error.tsx` cho trang chưa có màn lỗi riêng. Mọi màn lỗi gửi lỗi về Sentry (`useReportError`) |
| `PageSheet` | Sheet dùng chung của app, kiểu sheet toàn màn của iOS (`Drawer variant="page"`): thanh trên cùng có nút ✕ tròn (cách mép trên và trái 16), tiêu đề nhỏ ở giữa (kiểu chính), `action` bên phải (nút tròn, hoặc như ✓✓ "Đánh dấu tất cả đã đọc" ở Thông báo; hoặc nút có chữ `secondary` cỡ thường: cao 44 và nổi như ✕); các nút tròn trên thanh luôn có bóng mềm, lúc mở cũng như khi cuộn (theme tối không còn viền mảnh từ 2026-10-16: nút xám đã tách khỏi nền đen). `hideTitle` chỉ cho sheet cần tiêu đề lớn trong nội dung (màn gói). Nội dung cuộn xuyên dưới thanh, như sheet của app Claude: khi đã cuộn, một lớp màu nền sheet phủ từ mép trên qua cả thanh, đậm nhất ở mép trên rồi nhạt dần về 0 ở 16px dưới thanh, không có đường kẻ; sau tiêu đề lớp phủ giữ dày qua dòng chữ. `footer` (một nút cỡ thường, rộng hết) nổi trên cuối nội dung với lớp mờ tương tự từ mép dưới lên qua nút; nội dung chừa đúng chiều cao chân nên dòng cuối cuộn lên khỏi nút. Lỗi (`FieldError`) đặt ngay trong chân, trên nút, nằm trên nền của sheet (bo 12) nên chữ không đè lên nội dung cuộn phía sau (2026-10-17). Chạm vào toast (Hoàn tác, vuốt bỏ) không tính là chạm ra ngoài: sheet đang mở vẫn mở (áp cho mọi `Drawer`). Nền mặc định `grouped` (xám như trang, thẻ trắng và nhóm dòng trên đó, form dùng `FormSection`); `plain` (trắng) chỉ cho sheet là một form trần. Trên điện thoại sheet phủ kín màn hình, cả thanh trạng thái (không bo góc trên, thanh ✕ ngay dưới thanh trạng thái), nên thanh lấy màu của sheet: nền `grouped` trùng màu trang nên thanh không đổi (xem Status bar); từ `sm` là tấm bo góc trên, cách đỉnh 6dvh; từ `md` là panel nổi bên phải, trượt vào từ phải (xem Drawer `variant="page"`). **Sheet mở từ trong sheet** (2026-10-18): một `PageSheet` đặt bên trong một `PageSheet` đang mở (kể cả trong `action` hay chân của nó, hoặc sâu trong component con như dòng giao dịch trong sheet tài khoản) không mở thành sheet thứ hai đè lên mà được đẩy vào sheet đang mở: nội dung mới trượt vào từ phải và đẩy nội dung cũ ra hẳn bên trái, hai màn đi cùng nhau (0,5 giây, chậm lại từ 0,35 ngày 2026-10-18; ease iOS, mỗi màn lệch 110% để qua lề 16 hai bên); thanh trên của nó có ‹ để quay lại, tiêu đề hiện dần. Màn cũ vẫn giữ (ẩn sau khi trượt ra) nên những gì đã nhập còn nguyên khi quay lại, và mỗi màn nhớ chỗ đã cuộn. Đóng sheet (✕, kéo xuống, bấm ra ngoài) là đóng hết các màn đã đẩy vào; mở lại thì về màn đầu. Esc lùi một màn, ở màn đầu thì đóng sheet. Sheet con phải nằm trong cây của sheet cha (không đặt cạnh nó); cùng component đó mở ở nơi khác (không trong sheet) thì vẫn là sheet riêng. Đổi chi tiết → sửa trong cùng một lần bấm thì màn sửa thay màn chi tiết (‹ về màn trước đó). Màn sâu mở từ bên trong nội dung (danh sách để chọn, chi tiết) dùng `PageSheetScreen`, trượt y như vậy. Dùng cho màn gói, Thông báo. Trong `/design` (mục Feedback & Overlay) có sheet mẫu tổng hợp (`sheet-playground.tsx`): đổi ngay trong sheet giữa tiêu đề trên thanh và tiêu đề lớn, nền xám và trắng, bật tắt nút phải và nút chân; kèm khối tóm tắt, segmented, form, dòng, công tắc, thông báo, danh sách dài, dòng xoá; dòng Tài khoản mở một `PageSheetScreen` (danh sách tài khoản) để xem cú trượt |
| `PickGrid` | Chọn một thứ bằng lưới ô (`components/app/pick-grid.tsx`), như app tiền chọn hạng mục hay ngân hàng: 4 cột trên thẻ trắng dưới tiêu đề nhóm, 7 lựa chọn hay gặp nhất (`gridChoices`: thứ đang chọn luôn có mặt, thay ô cuối nếu cần), ô đang chọn nền xám viền đậm, ô cuối "Tất cả" mở danh sách đủ ở màn sâu (`PageSheetScreen`). Mỗi ô: ô 36 (`IconTile` hay `AccountLogo`) và tên tối đa hai dòng (hạng mục), hoặc một dòng cắt bằng "…" khi dài (`labelLines={1}`: ngân hàng, ví). Lỗi: khung đỏ và dòng lỗi dưới. `tileShape="circle"` cho người (ô "Tất cả" cũng tròn), `allIcon` / `allLabel` đổi ô cuối, `gridChoices(…, count)` cho số ô (3: một hàng). Dùng cho hạng mục (form giao dịch), ngân hàng, ví (form tài khoản) và người (form khoản nợ) |
| `TimeRows` | Thời điểm trong một nhóm dòng (`components/forms/time-rows.tsx`; không truyền `time` thì chỉ chọn ngày, như ngày vay; `min` cho ngày sớm nhất): dòng "Thời gian … Hôm nay, 20:02 ▾" (`title` đổi được, như "Bắt đầu từ"), chip Hôm nay · Hôm qua · Hôm kia dưới dòng (xuống dòng thay vì tràn trên màn rất hẹp; `quickDays={false}` để bỏ, cho thứ ít khi ghi ngay lúc xảy ra), chạm dòng mở ô ngày và giờ của máy; cách chip và ô 8px (không chip: ô cách dòng trên và đường kẻ dưới 8px), không kẻ giữa. Từ năm 2000 tới hôm nay, gửi `date` và `time` |
| `ChoiceTiles` | Vài ô cạnh nhau, chọn một, như bảng giá: vòng radio ở đầu, chip đối diện (ngắn, như "Giảm 28%"), rồi con số và một dòng mô tả. Radio group bên dưới (phím mũi tên, trình đọc màn hình). `tone="ai"` tô ô đang chọn màu `ai` (kỳ thanh toán Pro); mặc định viền đen |
| `FlowTiles` | (`variant="lead"` ô xanh chanh và ô đen đã bỏ 2026-10-21, trái với quyết định thẻ dẫn đầu trơn.) Mặc định: tiền theo hai chiều (sheet một ngày, danh bạ) là hai nửa của một thẻ, chia bằng vạch mảnh thụt 16 trên dưới (như Figma). Mỗi nửa là `@container`, số tiền dùng `Money fit` nên không bao giờ ngắt giữa số: ô icon, nhãn, số tiền `lg` có dấu (chỉ tiền vào có màu) và ghi chú; không có `onValueChange` thì thẻ chỉ hiển thị số, như ở Giao dịch (lọc bằng hàng chip) và Vay nợ (danh sách đã chia sẵn Cần thu / Cần trả); có thì chạm một nửa để danh sách chỉ còn chiều đó (nửa đó nền xám, nửa kia mờ đi), chạm lại để bỏ, hiện chưa trang nào dùng. `FlowTilesSkeleton` cho màn tải |

Danh sách nằm ở `components/settings-list.tsx`. `SettingsGroup` là nhóm dòng trong một thẻ
(`size="lg"` cho trang dạng bảng tin), tiêu đề nhóm là nhãn 12 in hoa giãn chữ như list nhóm của
iOS ("HÔM NAY", "CHUNG"; `groupCaptionClassName`, dùng chung cho `FormSection` và bộ lọc; tên cắt "…" trong tiêu đề có thêm 4px trên dưới để Safari không cắt dấu chồng của chữ hoa như "Ể"); đường kẻ giữa các dòng thụt 16 vào từ hai bên, màu token `separator`, màu kẻ của mẫu "Mobile Expense Tracker" `#e8e6e1` (2026-10-09; đậm hơn `border`, vốn gần trùng thẻ trắng). Dòng đang ấn hoặc rê chuột: nền xám phủ lên cả hai đường kẻ trên và dưới nó (2026-10-14). `SettingsRow` là **mọi** dòng list (cài đặt, giao dịch, nhiệm vụ…), nên các list đồng nhất: cao 64
(tiêu đề và mô tả mỗi thứ một dòng, cắt bằng "…"; `fullDescription` cho chữ mà dòng tồn tại để hiện: ghi chú trong chi tiết tài khoản, khoản vay, giao dịch, câu trả lời của máy tính lương, thông báo; dòng đó cao hơn 64), lề ngang 16, `icon` tự đặt trong `IconTile` cỡ `sm` (36,
bo 12) màu theo `tone` (xám nếu không truyền), tiêu đề 14 (Body, đậm 500), mô tả 12 (Caption), rồi giá trị, công tắc, số
tiền hoặc mũi tên ở bên phải. `media` cho avatar và logo tài khoản (`AccountLogo`: ô vuông bo 10 cỡ 36 như `IconTile sm`, logo trên nền trắng, tiền mặt là tờ tiền xanh; `size="xs"` 20 trong select; `size="lg"` 48 bo 14 ở đầu sheet chi tiết tài khoản; `lazy` chỉ tải logo khi gần tới màn hình, cho danh sách dài như mọi ngân hàng). `swipeAction` cho dòng vuốt để xoá. Dòng ở
trang Cài đặt dùng ô xám trung tính cho mọi mục (2026-10-09), trừ Nâng cấp Pro (`ai`). `SettingsGroup stickyCaption`: tiêu đề nhóm bám đỉnh màn khi các dòng cuộn dưới nó, tới khi tiêu đề nhóm sau đẩy đi, như list iOS (các ngày ở Giao dịch); nền màu trang hơi trong và mờ phía sau, trên điện thoại trải hết bề ngang; desktop bám dưới thanh trên 64px (thanh không có đường kẻ ở đáy: thử 2026-10-16, bỏ vì không đẹp). `SettingsGroup collapsible`: nhóm ẩn dòng tới khi cần (khoản đã tất toán, tài khoản đã khoá); tiêu đề vẫn thẳng hàng với các nhóm khác, cuối tiêu đề là "Hiện … ⌄" / "Thu gọn ⌃", cùng kiểu với "Xem tất cả ›" của `SectionHeader` (14, đậm vừa, `foreground/70`, mũi tên cùng màu); thẻ trượt mở và đóng (tức thì khi giảm chuyển động). `footer` cỡ Caption 12. Dòng Vay nợ: bên phải là hạn trả; không có hạn thì lãi suất, hoặc phần trăm đã trả, hoặc "Không hạn trả"; lãi suất hay dự tính đứng trước ghi chú ở mô tả.

Màn tải: `SettingsGroupSkeleton` / `SettingsRowSkeleton` (cùng file) có đúng kích thước nhóm và dòng thật (dòng tiêu đề, bo thẻ, dòng 64, ô 36 hoặc avatar, avatar 48 `avatar-lg` cho hồ sơ, `align="center"` cho dòng như Đăng xuất, đường kẻ thụt, giá trị hay số tiền bên phải). Mỗi `loading.tsx` dựng lại từ chính bố cục của trang (`OverviewLayout`, `TransactionsLayout`, `BudgetLayout`) và các skeleton này, cùng `PageHeaderSkeleton` (tên trang thật; công cụ tròn hay viên thuốc, nút có chữ theo độ rộng), `FlowTilesSkeleton`, `FloatingActionsSkeleton`, nên khung trang không nhảy khi dữ liệu tới. Những khối chỉ có khi có dữ liệu (Nhiệm vụ, Sắp đến hạn, cảnh báo quá hạn) không có chỗ chờ sẵn, nên khi có chúng, phần bên dưới vẫn dời xuống.

Utility `pressable` (trong `globals.css`) cho phản hồi chạm của thẻ và ô bấm được không phải
`Button`. Dòng list `muted` (2026-10-11) xám cả hàng: ô icon mất màu, tên xám, cho mục không được tính (giao dịch "Không tính vào báo cáo": số tiền xám, không thêm nhãn (2026-10-11: chỉ màu xám là đủ); công tắc cùng tên ở cuối form thêm/sửa và cuối sheet chi tiết, chỉ khoản thu/chi; lọc "Chỉ khoản ngoài báo cáo" trong bộ lọc). Dòng list bấm được xám đi khi chạm (`active:bg-muted`), phẳng hết bề ngang và cắt theo góc thẻ, đường kẻ hai bên vẫn giữ khi chạm (2026-10-10: ẩn đi trông như kẻ nháy mỗi lần chạm) (`Item shape="flush"`); từ md, dòng đang mở bên cạnh cũng vậy. Trên màn cảm
ứng, giữ lâu không chọn chữ của giao diện và không mở xem trước liên kết (`globals.css`); ô nhập
và chữ có `select-text` (ghi chú của giao dịch, tài khoản, khoản vay) vẫn chọn được.

## Mẫu màn hình

### Khuôn trang (2026-10-08)

Mọi trang tab theo cùng một thứ tự, như các thiết kế app trên Figma:

1. **Đầu trang** (`PageHeader`): một hàng gọn, tên trang bên trái, công cụ bên phải; cuộn cùng
   trang. Trên điện thoại luôn hiện (không ẩn vì "thanh tab đã gọi tên trang").
2. **Thẻ dẫn đầu:** con số quan trọng nhất của trang, trên `Card size="lg"` **thường** (trắng,
   theme tối xám thẻ) từ tối 2026-10-19 (mẫu E của mockup thẻ dẫn đầu, sau một ngày thẻ `inverse`
   đen / trắng, người dùng thấy theme tối loá, và một ngày pastel): thẻ không khác thẻ thường về
   chất liệu, chỉ dẫn đầu bằng con số lớn nhất màn và bố cục; các ô bên trong (`StatGroup tiles`,
   danh sách loại tài khoản, ô icon) là `track`; chữ phụ `muted-foreground`, vạch `separator`; thay
   đổi trong tháng là chip mực chữ xanh chanh (`primary` + `ai-on-primary`) khi tăng, `expense` khi
   giảm; tiền vào màu `income`, đỏ là `expense` thường. `inverse` (đen, hai vòng tròn trắng mờ 10% và
   5% tràn ra góc phải khi `discs`) chỉ còn ở trang giới thiệu, đăng nhập, màn chào và catalog.
3. **Các nhóm:** `Section` (tiêu đề đậm 20) cho nội dung chính của trang bảng tin, `SettingsGroup`
   (nhãn nhỏ in hoa) cho nhóm ngày, nhóm cài đặt, các phần của một list. Không có kiểu tiêu đề
   thứ ba.
4. **Một nút nổi** (`FloatingActions`) cho thao tác chính; list chừa đủ chỗ dưới cùng.

| Trang | Bên trái | Bên phải (điện thoại) | Thẻ dẫn đầu |
|---|---|---|---|
| Tổng quan | icon app, tên Timi, lời chào (desktop: "Tổng quan" và lời chào nhỏ dưới) | nút sáng/tối, chuông, avatar mở Cài đặt (2026-10-20) | Tài sản ròng: thẻ trắng, số `Money display`, chip "thu − chi tháng này" (mực chữ xanh chanh), ba ô `track` (`StatGroup tiles`); từ lg thẻ chạy hết chiều ngang, ba ô bên phải. Thứ tự (2026-10-20): Tài sản ròng, Sắp đến hạn (lên ngay dưới khi có khoản quá hạn hay còn ≤ 3 ngày, không thì xuống cuối), Hạn mức (thanh màu hạng mục), Theo hạng mục (segmented nhẹ trong thẻ), Lịch (ngày có chi tô xám đậm dần 4 mức), Thu chi 6 tháng, Nhiệm vụ (gọn một dòng khi còn ≤ 2 và không có thưởng chờ) |
| Giao dịch | Giao dịch | tháng (viên thuốc), AI | Một thẻ trắng (`MonthSummary`, 2026-10-19, mẫu A của mockup giao-dich; trước là hai ô `FlowTiles variant="lead"` và một thẻ hạn mức riêng): Thu và Chi hai cột (ô icon `xs`, nhãn, số `lg` có dấu, Thu màu tiền vào, số giao dịch), rồi ở tháng hiện tại khi có hạn mức tổng: vạch `separator`, "Đã dùng 29% hạn mức tổng · còn 850k", thanh `LimitBar sm` và mũi tên; chạm cả thẻ mở sheet Hạn mức (ghi chú hũ chỉ còn ở đó). Cao khoảng 175 thay vì 212 |
| Tài khoản | Tài khoản | | Tổng số dư: thẻ trắng, các loại đang có chồng như thẻ trong ví ở góc (ô đầu xanh chanh, các ô sau `track`, viền `card`), danh sách loại trong ô `track`, mỗi loại một dòng với số đầy đủ, âm thì đỏ (`BalanceHero`). Từ lg (2026-10-09): thẻ trải hết chiều ngang, dưới là lưới thẻ tài khoản 2 cột (3 từ xl; `AccountCard`: logo, tên và loại · ngân hàng ở trên, số dư ở chân, cao bằng thẻ bên cạnh, bấm mở sheet chi tiết; vào / ra tháng này bỏ 2026-10-16; `AddCard` cao tối thiểu 144 nên hàng thẻ tài khoản gọn). Điện thoại: dòng tài khoản chỉ có tên (loại để logo nói, 2026-10-16), dưới tên chỉ còn "Ngoài báo cáo" khi có; "Đã khoá" vẫn là list gập, rộng tối đa 2xl. Điện thoại (2026-10-14): không có nút + nổi trên thanh tab; thêm tài khoản ở dòng cuối "Tài khoản chính" ("Thêm tài khoản", như "Thêm hũ"), chưa có tài khoản thì nút trong khung trống. Không còn nút ở đầu trang: từ lg, hũ cũng là thẻ cùng cỡ thẻ tài khoản (`JarCard`: vòng, tên, kế hoạch; "Đã có … / 15tr"; Mục tiêu và Mỗi tháng nên nạp dưới vạch), ô cuối mỗi lưới là thẻ viền nét đứt `AddCard` ("Thêm tài khoản", "Thêm hũ") |
| Vay nợ | Vay nợ | người liên hệ | Cần thu / Cần trả: thẻ trắng, nửa vòng tròn xanh (cần thu) và mực (cần trả), số ròng ở giữa, một dòng nói nghiêng về bên nào (`DebtBalance`). Từ lg (2026-10-09): thẻ nằm ngang, nửa vòng bên trái, Ròng · Cần thu · Cần trả là ba con số bên phải; dưới là dải quá hạn rồi hai cột Cần thu | Cần trả (bên trống vẫn giữ cột với dòng "Không có khoản nào"); không còn khung chi tiết bên cạnh, khoản nợ mở sheet chi tiết như trên điện thoại |
| Cài đặt | `ScreenHeader` trên điện thoại (nút back, "Cài đặt" ở giữa); `PageHeader` từ md | | Hồ sơ không thẻ như Apple Account (`ProfileHeader`, 2026-10-19): avatar 96 (`Avatar size="2xl"`, chữ tắt `AvatarFallback inverse`: đen chữ trắng, theme tối trắng chữ đen, 2026-10-20) ở giữa, tên 28 đậm, email 15 xám xuống dòng tự do, nhãn gói `Badge soft` / `ai` dưới; không dấu Pro. Nhóm (2026-10-20): Lượt AI, Chung, Thông báo, Ứng dụng, Hỗ trợ (Câu hỏi thường gặp, Góp ý với Timi, Email hỗ trợ), Quản trị, Dữ liệu (Xuất dữ liệu; thẻ riêng bên dưới cho Xoá toàn bộ dữ liệu và Xoá tài khoản, hai dòng đỏ căn giữa; mỗi dòng một sheet), Đăng xuất ; từ md cả trang (tiêu đề và các nhóm) là một cột rộng 2xl nằm giữa màn (2026-10-10); cuối trang sau Đăng xuất là icon app 48, tên Timi và "Phiên bản … · Beta", như phần Giới thiệu của app iOS (2026-10-13) |

Mỗi trang một bố cục thẻ dẫn đầu (2026-10-09), cùng chất liệu thẻ thường và bộ màu mực, xanh chanh, màu tiền vào, để Tài sản ròng và Tổng số dư không còn giống nhau.

Trước khi báo xong một màn mới, kiểm tra:

- Có đầu trang (`PageHeader`) trên điện thoại chưa?
- Chỉ một thẻ dẫn đầu (thẻ thường, dẫn bằng con số lớn) và tối đa một nút nổi?
- Tiêu đề nhóm thuộc một trong hai kiểu?
- Đỏ chỉ dùng cho cảnh báo?
- Nút nổi có đè thứ không cuộn được không? Số tiền dài nhất có ngắt dòng không? (ô hẹp: dùng `Money fit`)

### Trợ lý AI (2026-10-11)

Một trợ lý cho cả app (`components/ai-assistant/`), mở từ nút tròn đen có gương mặt Timi (`BotIcon`) cạnh thanh tab (điện thoại) hoặc "✦ Hỏi AI" trên thanh đầu trang (máy tính). Không có khung sheet: trang phía sau tối đi như dưới sheet (không nhoè), thanh tab trượt đi và ô nhập dạng viên thuốc nổi lên đúng chỗ đó, cạnh nút X tròn. Câu hỏi là bong bóng đen bên phải; câu trả lời là **một thẻ duy nhất** đổi chiều cao mượt (0,42s) từ lời chào sang khung chờ sang câu trả lời. Ô nhập có một nút ở cuối: 🎤 nói, ↑ gửi (gõ hay nói xong đều là ↑, như ChatGPT/Claude), ■ dừng khi AI đang trả lời. Khi ghi âm, sóng âm chạy trong ô; phía trên chỉ một dòng "Đang nghe…" / "Đang chuyển thành chữ…". Khung chờ có chữ ánh sáng quét (`text-shimmer`) theo từng bước.

Thẻ trả lời ghép từ khối theo câu hỏi (`answer-view.tsx`, mẫu ở `/design`; trả lời được dữ liệu của mọi trang: tổng chi/thu, so sánh, nhiều nhất và ít nhất, theo ngày và theo tháng (khối cột, một hoặc hai chuỗi thu/chi), liệt kê với lọc số tiền và khoản không tính, chuyển khoản, tiền vào/ra và thông tin tài khoản (số dư ban đầu, ngày mở, đã khoá), số dư, tài sản ròng như ở Tổng quan, vay nợ (cần thu/cần trả, sắp đến hạn, chi tiết một người với lãi và lịch sử trả, đã trả xong, thu nợ/trả nợ và khoản mới trong kỳ), và lượt AI còn lại, ngày hết hạn Pro, nhiệm vụ còn lại (không tốn lượt); tài khoản hiện bằng logo ngân hàng/ví như mọi nơi khác): đầu thẻ (nhãn ghi rõ đã tính gì, con số `Money xl`, `DeltaBadge`, một câu), thanh chia theo nhóm, hai thanh so sánh, dòng giao dịch / người / tài khoản (nhóm theo ngày khi liệt kê), nút "Mở trong …", chip hỏi tiếp. Thẻ lỗi cùng khung: chưa nghe rõ (Nói lại), chưa kết nối được (Thử lại), hết lượt (Nâng cấp Pro, nền xanh chanh), chưa trả lời được, chưa làm được việc này, không đọc được khoản nào. Trò chuyện (chào hỏi, hỏi trợ lý là ai, đùa, tâm sự, câu ngoài dữ liệu): trợ lý tên **Timi** (✦ Timi ở đầu thẻ) đáp 1–3 câu, chữ hiện dần từng từ, kèm chip quay về hỏi tiền; không tốn lượt AI, tối đa 30 câu mỗi ngày.

**Ghi giao dịch** (2026-10-12, `drafts-view.tsx`): kể một hoặc nhiều khoản (tối đa 10) trong một câu, tốn một lượt AI. Timi không lưu ngay mà hiện **thẻ xem trước**: mỗi khoản một dòng như list giao dịch (icon hạng mục, tên, tài khoản · giờ · phí · "Ngoài báo cáo"), × để bỏ, chạm dòng mở form giao dịch có sẵn đã điền (nút "Xong" chỉ đổi dòng). Chữ đỏ chỉ khi thiếu số tiền hay tài khoản. Khi không có hạng mục hợp, AI gợi ý hạng mục mới với icon nó chọn từ bộ icon của app: dòng hiện icon đó (màu nhóm, hoặc ô `card` nếu nhóm cũng mới) kèm `badge` "Mới", dưới là hàng chip `outline`: "＋ Tên mới" (đang chọn), các hạng mục cùng nhóm, "Khác…". Trong form, hạng mục mới là ô đầu lưới, cũng có "Mới", chọn sẵn. Một dòng gần nút ghi "Kem, xem phim và thuốc men sẽ được tạo mới". "Lưu cả N khoản" tạo hạng mục rồi ghi tất cả cùng lúc, hoặc không ghi gì; sau đó thẻ thành "Đã ghi N khoản" với ✓ và "Hoàn tác" (cả trong toast), hoàn tác xoá giao dịch và thu hồi hạng mục, nhóm vừa tạo. Nhiệm vụ AI ở Tổng quan mở Timi; trợ lý cũ và nút "Nhập bằng AI" ở trang Giao dịch đã bỏ (Timi mở từ thanh tab, hay "Hỏi AI" trên máy tính).

Chuyển động chỉ dùng opacity và transform (CSS, không `motion`, không blur): thứ hiện ra trượt lên từ dưới, thứ rời đi chìm xuống; mở nhanh (0,3s, chậm dần), đóng chậm hơn (0,42s) và nội dung đi trước ô nhập; giảm chuyển động thì đứng yên.

### Các màn khác

- **Trang dạng bảng tin** (Tổng quan): đầu trang, thẻ tài sản ròng (nhãn `CardLabel`, con số
  chính, ba phần chia cột), nhiệm vụ, rồi các `Section`: tháng (chỉ lịch), theo hạng
  mục (biểu đồ tròn, không list), thu và chi theo tháng, sắp đến hạn (cuối trang; từ lg cuối cột trái). Lời mời Pro (gói Free) đi cùng thứ khác
  cho thêm lượt AI: dòng cuối của thẻ nhiệm vụ khi còn nhiệm vụ; nhận hết thì thẻ nhiệm vụ biến
  mất và `PromoBanner` Pro đứng vào chỗ đó, ngay dưới tài sản ròng. Đổi tháng ở lịch (‹ ›)
  thì lưới ngày trượt ngang theo hướng bấm (tháng sau vào từ phải), hàng thứ đứng yên. Các khối
  cách nhau 24px.
- **Trang danh sách** (Giao dịch, Tài khoản, Vay nợ, Cài đặt): đầu trang, thẻ dẫn đầu, rồi các
  `SettingsGroup` có tiêu đề nhóm. Ngày ghi "Hôm nay, 08/10", "Hôm qua, 07/10", rồi "Thứ Ba,
  06/10" (`formatDayLabel`); bên phải tiêu đề ngày là tổng vào (xanh) và tổng ra của ngày;
  tiêu đề ngày bám khi cuộn, thành một dải cao 44. Ô tìm ở Giao dịch nằm trong `<form
  role="search">`: phím Tìm trên bàn phím ẩn bàn phím (kết quả lọc ngay khi gõ).
- **Giao dịch trên desktop** (từ lg, 2026-10-09): cột trái (thẻ tháng và bộ lọc) nằm trong trang, hiện đủ, không cuộn riêng; danh sách bên phải là khung dính dưới thanh đầu, tự cuộn, không thanh cuộn, và không kéo trang theo khi hết (`overscroll-contain`); dòng giao dịch có ghi chú thì ghi chú nối sau tài khoản ở dòng phụ ("MoMo · Trả Doanh ăn trưa", cắt "…" khi dài; điện thoại không hiện); tiêu đề ngày dính sát mép trên khung với dải nền như trên điện thoại (biến `--sticky-caption-top` / `--sticky-caption-pad` của `SettingsGroup stickyCaption`, mặc định dưới thanh đầu 4rem), nên cuộn danh sách thì trang đứng yên, cuộn trang để xem nốt bộ lọc thì danh sách vẫn trong tầm nhìn (`TransactionsLayout`).
- **Lọc và tìm ở Giao dịch** (điện thoại): thẻ Thu / Chi (`MonthSummary`) chỉ hiển thị; dưới ô tìm là
  `ChipRow`: chip "Lọc" mở sheet điều kiện khác (không có loại), vạch chia, rồi Tất cả · Thu · Chi · Chuyển khoản · Vay nợ. Sheet lọc
  (`TransactionFilterSheet`) theo kiểu bộ lọc iOS: màn đầu là ba dòng Tài khoản · Hạng mục · Số
  tiền, bên phải ghi đang lọc gì ("Tất cả", "Ví MoMo", "2 hạng mục", "100k – 1tr"); chạm một dòng
  mở màn con (‹ quay lại, "Bỏ chọn" bên phải khi có chọn) là list chọn (`SettingsRow checked`):
  tài khoản có logo, hạng mục có icon và màu, chia Chi tiêu / Thu nhập (ẩn khi lọc chuyển khoản,
  vay nợ); số tiền chọn một mức (Bất kỳ, Dưới 100k, 100k – 1tr, Trên 1tr) hoặc "Tuỳ chỉnh" mở hai
  ô Từ / Đến, xếp chồng để mỗi ô và hàng gợi ý của nó rộng hết. Chọn là áp ngay; chân sheet "Xoá lọc" (chỉ khi có lọc: bấm thì nó thu hẹp và mờ đi trong 300ms còn "Xem N giao dịch" giãn ra hết chiều rộng; chọn lọc lại thì trượt ra) và "Xem N giao dịch". Điều
  kiện của sheet đang bật hiện thành chip có × ở hàng dưới. Chạm ô tìm mở màn tìm: đầu trang và thẻ tổng thu gọn
  (`Collapse`) để ô tìm trôi lên đầu, "Huỷ" trượt ra bên cạnh (xoá chữ, đóng màn), thanh tab
  (`data-hide-tab-bar`) và nút + (`FloatingActions concealed`) trượt xuống khỏi màn; Huỷ đảo
  ngược tất cả. Khi có
  chữ, kết quả là một list phẳng, mới nhất trước: so khớp như app Việt: gõ có dấu (kể cả đ) thì dấu phải đúng ("ăn" không ra "khoản", "Lan"), gõ không dấu thì bỏ dấu và đ là d ("di lai" ra "Đi lại"), không phân biệt hoa thường (`searchKey`); chữ khớp tô nền `warning/25`, bên phải ghi
  ngày thay giờ (năm khác thì có năm); trên list là "N kết quả trong Tháng 10 · tổng …" và "Tìm
  mọi tháng" (tải mọi giao dịch khi cần, `loadAllTransactionsAction`). Không có kết quả: nói đã
  tìm gì, ở đâu, đang lọc gì, kèm "Bỏ lọc" và "Tìm mọi tháng". Desktop giữ bảng lọc bên trái
  trên một màn: loại, số tiền (cùng các mức, "Tuỳ chỉnh" trượt mở hai ô), tài khoản có logo và
  hạng mục có icon màu trên chip; kết quả tìm cũng là list phẳng như trên.
- **Thêm / sửa giao dịch** (`TransactionForm`, dùng chung cho Thêm, Sửa và Ghi lại), như app tiền:
  bộ chọn Chi tiền · Thu tiền · Chuyển khoản, số tiền lớn (`CurrencyInput variant="hero"`, bàn phím
  chờ chạm vào số) và gợi ý; chi/thu có lưới hạng mục 4 cột (`PickGrid`) (7 hay dùng nhất, đang chọn viền
  đậm, ô cuối "Tất cả" mở màn sâu chia theo nhóm, cuối có "Quản lý hạng mục"), rồi một nhóm dòng:
  Tài khoản (logo, mở màn sâu chọn tài khoản có số dư), Thời gian ("Hôm nay, 20:02", chip Hôm nay
  · Hôm qua · Hôm kia, chạm dòng mở ô ngày giờ của máy), ghi chú gõ tại chỗ "Ghi chú (tuỳ chọn)",
  tự cao dần. Chuyển khoản: thẻ Từ ⇄ Đến có logo (nút giữa đổi chiều), phí gập thành "+ Thêm phí
  chuyển khoản". Không dấu \* bắt buộc; lỗi hiện tại chỗ (số tiền, khung lưới đỏ, dòng đỏ).
- **Thêm / sửa tài khoản** (`AccountForm`, Tài khoản), cùng bố cục với form giao dịch: bộ chọn
  Tiền mặt · Ngân hàng · Ví điện tử, "Số dư ban đầu" ("Số dư hiện tại" khi sửa) là số lớn
  (`CurrencyInput variant="hero"`) kèm gợi ý; ngân hàng và ví có `PickGrid` logo (7 phổ biến, "Tất
  cả" mở màn sâu "Chọn ngân hàng" có ô tìm theo tên, viết tắt, chia Phổ biến · Ngân hàng số ·
  Ngân hàng khác A–Z). Kết quả tìm xếp theo độ khớp (`searchInstitutions`): trùng tên ngắn hay
  viết tắt ("mb", "vcb"), tên ngắn bắt đầu bằng chữ gõ ("mb" ra MB Bank trước Vietcombank), mỗi
  từ gõ là đầu một từ của tên ngắn, viết tắt ("nam a"), rồi của tên đầy đủ ("quan doi"), cuối
  cùng là khớp giữa từ; bằng nhau thì giữ thứ tự phổ biến; dấu theo quy tắc chung (`searchKey`,
  `lib/search-text.ts`). Rồi một nhóm dòng: Tên (gõ tại chỗ, canh phải; tự lấy tên ngân hàng, ví,
  hoặc "Tiền mặt", tới khi người dùng tự gõ), Số dư âm (công tắc, "Đang nợ, thấu chi"; bật thì số
  đỏ có dấu −), Bắt đầu từ (`TimeRows` không chip), ghi chú gõ tại chỗ. Lỗi hiện tại chỗ.
- **Thêm / sửa nhóm và hạng mục** (`CategoryEditor`, `components/categories/category-editor.tsx`, 2026-10-09; từ
  Cài đặt → Hạng mục), cùng kiểu form người, tài khoản: ô biểu tượng `lg` đúng màu ở đầu và "3 hạng mục" /
  "Trong nhóm Ăn uống" dưới, đổi theo mỗi lựa chọn (không lặp tên ở đây: tên dưới ô lớn trông như chỗ để sửa); dòng "Tên" gõ tại chỗ; "MÀU" (chỉ nhóm; hạng mục lấy màu nhóm)
  là `ColorPicker`: 10 chấm tròn trên thẻ trắng, chấm đang chọn có vòng và ✓; "BIỂU TƯỢNG" là `IconPicker`: lưới
  6 cột hai hàng trên thẻ trắng (không khung cuộn lồng), ô đầu là biểu tượng lúc mở form; các ô giữ chỗ khi chọn, ô đang chọn sáng tại
  chỗ (màu nhóm, vòng quanh ô như chấm màu; chọn từ màn "Tất cả" mà không có trong lưới thì vào ô cuối), rồi gợi ý theo tên đang gõ (so từ với nhãn tiếng Việt của biểu tượng, bỏ từ đệm "và", "của"…; có dấu
  thì dấu tính, nên "sữa" không ra "sửa"), rồi biểu tượng của nhóm và các hạng mục trong nhóm; ô cuối mở màn sâu
  "Biểu tượng" (`IconPickerScreen`, form ẩn chứ không gỡ nên lưới giữ thứ tự: ô tìm, mỗi từ gõ là đầu một từ của nhãn; lưới đủ 200, chạm là chọn và quay
  lại). Chân: nút "Xoá" có chữ cạnh "Lưu thay đổi" ("Thêm nhóm" / "Thêm hạng mục" khi thêm); xoá hỏi lại bằng
  `ActionSheet` ("Xoá nhóm “Ăn uống” và 3 hạng mục bên trong? Giao dịch cũ vẫn được giữ."), vì xoá nhóm kéo theo
  các hạng mục và chưa có hoàn tác.
- **Danh bạ** (`ContactsSheet`, Vay nợ): nút người + trên thanh để thêm; ô "Tìm người" (tên, mối quan
  hệ, số điện thoại; dấu theo `searchKey`); nhóm "Đang có khoản" và "Không có khoản", theo tên A–Z;
  mỗi dòng là avatar, tên, mối quan hệ, bên phải số còn lại sau khi bù hai chiều ("+3.500.000đ Cần
  thu" xanh, "−800.000đ Cần trả", "Quá hạn" đỏ khi có khoản trễ). Chạm một người mở màn sâu: avatar
  `lg`, tên, mối quan hệ · số điện thoại, `FlowTiles` Cần thu / Cần trả với người đó, "Khoản đang mở"
  (chạm thì đóng sheet và mở khoản đó như chạm dòng ở trang), "Đã tất toán" gập, ghi chú, "Ghi khoản
  mới với …" (form khoản nợ chọn sẵn người), "Gọi …" khi có số, "Xoá người" (mờ kèm chú thích khi còn
  khoản; xoá có hoàn tác); bút chì trên thanh để sửa. Thêm / sửa người (`AddContactSheet`): avatar xem
  trước, chữ cái theo tên đang gõ (lưu cũng cập nhật chữ cái); dòng gõ tại chỗ Tên, Mối quan hệ (chip
  Bạn bè · Gia đình · Đồng nghiệp · Hàng xóm), Số điện thoại, ghi chú.
- **Thêm / sửa khoản nợ** (`AddDebtSheet`), cùng bố cục với form giao dịch: "Cho vay | Đi vay", số tiền
  lớn ("Số tiền cho vay", "Số tiền đi vay", hoặc "Tiền gốc còn nợ" với nợ có sẵn) kèm gợi ý; "CHO AI VAY" /
  "VAY CỦA AI" là `PickGrid` một hàng (3 người ghi gần nhất, avatar tròn, ô "Tất cả" mở màn "Chọn người"
  có tìm kiếm và "Thêm người mới"; chưa có ai thì ô cuối là "Thêm người"). Nhóm dòng, theo thứ tự cần
  quyết định: Nợ có sẵn (công tắc, đứng đầu vì nó quyết định có cần tài khoản không; bật thì dòng tài
  khoản gập lại, ngày thành "Bắt đầu theo dõi"; khoá khi sửa), "Tiền ra từ" / "Tiền vào" (logo, màn sâu
  chọn tài khoản), ngày vay (`TimeRows` chỉ ngày, chip Hôm nay · Hôm qua · Hôm kia), Hẹn trả ("Không
  hẹn"; mở ra chip 1 · 3 · 6 tháng tính từ ngày vay, ô ngày, "Bỏ hẹn"), ghi chú. Nhóm cuối: Tính lãi
  (dòng lãi suất "%" với "/tháng | /năm", dòng "Đến hạn …" tính sẵn gốc + lãi, hoặc lãi mỗi kỳ). Khi
  sửa, loại khoá lại nếu đã có lần thu hoặc trả.
- **Ghi nhận thu / trả nợ** (`RecordDebtPaymentSheet`, cả khi sửa một lần): tiêu đề "Thu nợ" / "Trả nợ" /
  "Sửa lần thu"; trên số tiền là người, như màn chuyển tiền của app ngân hàng: avatar `lg`, "Lan Anh trả
  bạn" / "Bạn trả Chị Hà", ghi chú của khoản ("· tính cả lãi" khi có lãi); số tiền lớn (thu: "+" xanh,
  trả: "−"), chip "Toàn bộ 3.500.000đ · 1/2 · 1/3" (chip Toàn bộ ghi luôn số còn lại) thay cho gợi ý
  theo chữ số, dòng "Sau lần này còn …" hoặc "✓ Tất toán khoản này"; vượt số còn lại thì báo ngay. Dòng
  "Vào tài khoản" / "Trả từ" (mặc định tài khoản của khoản vay nếu còn dùng; màn sâu chọn tài khoản),
  "Thời gian" (`TimeRows`, không trước ngày ghi khoản nợ), ghi chú; khi sửa có nút tròn xoá cạnh "Lưu thay đổi".
- **Chi tiết khoản nợ** (`DebtDetailInfo`, trong sheet ở mọi cỡ màn; khung bên phải từ xl đã bỏ 2026-10-09), kiểu biên lai:
  thanh "Chi tiết khoản nợ" có bút chì (khung bên phải: tiêu đề "CHI TIẾT KHOẢN NỢ", "Sửa" ở cuối; khung chờ tải `DebtDetailSkeleton` cùng hình); avatar `lg`, câu nói ai nợ ai
  ("Lan Anh nợ bạn", "Bạn nợ Chị Hà"), số còn lại `xl` ở giữa ("Gồm … lãi tính đến hôm nay" khi có lãi),
  rồi một nhãn trạng thái: "Còn 11 ngày", "Không hạn trả" (xám), "Quá hạn 7 ngày" (cùng chữ với dòng ở danh sách và Tổng quan), "Đến hạn hôm nay"
  (đỏ), "Đã tất toán" (xanh; số mờ, không có nút ghi nhận). Ngày cụ thể chỉ ở dòng Hẹn trả, không lặp. Thẻ tiến độ: thanh, "Đã thu …" và "30%
  của …". Có lãi thì nhóm "LÃI 1%/THÁNG": Tiền gốc, Lãi đến hôm nay (số ngày · lãi mỗi kỳ), Tổng gốc
  và lãi, Đến hạn (khi có hẹn). Nhóm thông tin: "Tiền ra từ" / "Tiền vào" kèm logo tài khoản (nợ có
  sẵn: "Không đổi số dư"), ngày vay hay bắt đầu theo dõi, Hẹn trả, ghi chú. "Lịch sử thu / trả": icon
  mũi tên, số có dấu, ngày giờ · tài khoản; chạm mở sheet sửa (có "Xoá lần thu này"), vuốt trái xoá;
  xoá đều có hoàn tác, không hộp xác nhận. Xoá khoản nợ nằm trong sheet sửa (nút tròn cạnh "Lưu thay
  đổi"), không ở cuối chi tiết vì cuối đã có nút "Ghi nhận thu".
- **Chi tiết tài khoản** (`AccountSheet`), cùng kiểu biên lai với chi tiết giao dịch: thanh "Chi tiết
  tài khoản" có bút chì tròn để sửa (cả khi đã khoá); đầu sheet là logo `lg`, tên, số dư `xl`
  ở giữa (âm thì đỏ, đã khoá thì mờ), dòng phụ loại · ngân hàng (bỏ phần tên đã nói) và "Đã
  khoá" (Tiền vào / Tiền ra của tháng bỏ 2026-10-16: gồm cả chuyển khoản và điều chỉnh số dư nên dễ hiểu
  lầm); dòng phụ có thêm "từ 31/08/2026" (thẻ "Bắt đầu từ" riêng, Số dư ban đầu, Đã tăng / Đã giảm bỏ 2026-10-16 cho gọn); ghi chú (nếu có); "Giao dịch gần đây" là `TransactionItem` (chạm mở chi
  tiết giao dịch; có cả các lần thu, trả nợ như trang Giao dịch), mô tả là đầu kia của chuyển khoản ("Đến Ví MoMo") hay nhóm hạng mục, số tiền theo
  tài khoản này, ngày dưới số tiền. Sheet chỉ để xem; khoá và xoá nằm trong sheet sửa (2026-10-13).
- **Sửa tài khoản** (`EditAccountSheet`): form tài khoản, cuối form công tắc "Khoá tài khoản" (icon ổ
  khoá, mô tả "Ẩn khi ghi giao dịch, không sửa được. Số dư và lịch sử vẫn giữ."), bật/tắt rồi bấm
  "Lưu thay đổi" mới áp dụng; nút thùng rác đỏ tròn cạnh nút Lưu ở chân sheet như sửa hạng mục.
  Công tắc bật thì các trường mờ và không sửa được; tài khoản đã khoá mà công tắc còn bật thì nút
  Lưu tắt; tắt công tắc rồi Lưu thì mở khoá và lưu luôn phần sửa. Xoá hỏi lại bằng `ActionSheet`
  (`DeleteAccountSheet`: "Xoá “Ví MoMo”? …", dòng đỏ "Xoá tài khoản", "Huỷ" tách riêng; tài khoản có
  chuyển khoản hay vay nợ thì không xoá được, gợi ý "Khoá tài khoản") rồi xoá có hoàn tác, đóng cả
  hai sheet.
- **Hạn mức chi tiêu** (2026-10-16, `components/budgets/`, `lib/budgets/`): hạn mức theo tháng, tự lặp lại: một
  cho cả tháng và một cho mỗi nhóm hạng mục chi (không theo hạng mục con). Đã chi chỉ tính khoản chi có hạng mục,
  trong báo cáo (giao dịch và tài khoản không "Ngoài báo cáo"), không trả bằng hũ tiết kiệm; không tính chuyển
  khoản (cả nạp/rút hũ, phí chuyển), điều chỉnh số dư, cho vay, trả nợ và lãi vay. Không có tab riêng, mở cùng một
  `PageSheet` "Hạn mức" từ ba chỗ: thẻ "Hạn mức tháng này" ở Tổng quan (dưới nhiệm vụ, chỉ khi đã đặt ít
  nhất một hạn mức; làm gọn 2026-10-19, thẻ cỡ thường: `BudgetTotal compact` khi có hạn mức tổng (số còn lại cỡ `lg`, thanh `md`, dòng nhịp chi; không
  còn chữ "Hạn mức tổng", vạch chia, chữ "Theo nhóm" và ghi chú hũ, phần đó chỉ còn trong sheet), rồi 2–3 nhóm gần chạm hay đã vượt, mỗi nhóm
  một dòng 20: ô icon `xs`, tên rộng 84, thanh `sm`, "%" hay "+250k" đỏ khi vượt (cột 40 không đủ cho chữ "Vượt"); cao khoảng 284 thay vì 465,
  "Xem tất cả ›"), dòng "Đã dùng 62% hạn mức tổng · còn 4,55tr" trong thẻ Thu / Chi ở Giao dịch (`MonthSummary`, từ 2026-10-19 cùng một thẻ,
  trước là thẻ trắng riêng `BudgetMonthLine`; chỉ ở tháng hiện tại và khi có hạn mức cả tháng; màn tải của Giao dịch có `MonthSummarySkeleton` cùng kích thước nên trang không bị đẩy xuống khi dữ liệu về), dòng "Hạn mức chi tiêu" ở Cài đặt › Chung
  ("12tr/tháng", "2 nhóm", "Chưa đặt"). `BudgetTotal`: "Còn lại" và số tiền lớn (hay "Vượt hạn mức" đỏ; 2026-10-17 bỏ "Còn được chi"),
  "62% / của 12tr" bên phải, `LimitBar md` màu theo tốc độ chi, dòng "Đang chi nhanh · còn 284k mỗi ngày"
  ("Chi vừa phải", "Chi ít hơn dự kiến"; tốc độ: % đã chi so với % tháng đã qua tính cả hôm nay, lệch quá 10 điểm là
  nhanh/chậm; chữ amber khi nhanh; 2026-10-17 bỏ chữ "kế hoạch"). Sheet: thẻ `BudgetTotal`, `NoticeBanner warning`
  "Đang chi nhanh" ("Đã dùng 77% hạn mức khi tháng mới qua 17 ngày.", tính bằng ngày, không bằng %), "THEO NHÓM · N" là
  các `LimitRow` (gần chạm nhất lên đầu), "CHƯA ĐẶT HẠN MỨC" là các nhóm còn lại với "Trung bình 4,12tr/tháng" và
  dấu +; chưa có hạn mức nào thì một ô icon, một câu và nút "Đặt hạn mức tổng". Sheet sửa: ô icon nhóm `lg`, tên,
  "Áp dụng cho mọi tháng", `CurrencyInput hero` bắt đầu từ mức chi trung bình 3 tháng gần nhất làm tròn lên
  (100k từ 1 triệu, dưới đó 50k; chia cho số tháng có chi trong 3 tháng đó), chip gợi ý là số đó, hai dòng
  "Trung bình 3 tháng" / "Đã chi tháng này", chân là Xoá (có hoàn tác) và Lưu. Trong form ghi khoản chi, dưới lưới
  hạng mục: "Ăn uống · Còn 580k · 36k mỗi ngày" (như chú thích dòng nhóm, `remainingLabel`; amber từ mốc báo sớm)
  hay "Ăn uống · Vượt 150k" (đỏ), chỉ khi nhóm có hạn mức và ngày ghi trong tháng này. Form chuyển khoản: phí làm
  hạn mức tổng vượt thì báo "Khoản này làm hạn mức tổng vượt 65k" dưới ô phí. Thông báo đẩy (`lib/budgets/alerts.ts`): mỗi hạn mức một lần khi chạm 80%
  ("Ăn uống đã dùng 85% hạn mức", phần trăm làm tròn xuống khi chưa vượt, lên khi đã vượt; "Còn 560.000đ cho 16 ngày, khoảng 35.000đ mỗi ngày.") và một lần khi vượt
  ("Vượt hạn mức Ăn uống", "Đã chi 4.150.000đ, vượt 150.000đ."), mỗi tháng; gửi sau khi lưu khoản chi, chuyển khoản (phí), khoản trả nợ (lãi) hay bỏ "Ngoài báo cáo" của tài khoản, chỉ
  theo cài đặt "Cảnh báo hạn mức" (mốc 80% hay 90%, hay chỉ khi vượt); chạm mở Tổng quan với sheet. Đặt hay sửa hạn mức thì mức đang đứng được ghi lại không báo.
  **Chưa có hạn mức nào** (2026-10-17, `budget-suggest.tsx`): ở Tổng quan, chỗ của thẻ hạn mức là "Hạn mức chi
  tiêu" mời đặt (`BudgetInvite`): ô icon, "Đặt mức chi tối đa mỗi tháng", một câu, ✕ "Để sau" (ẩn trên máy này,
  `localStorage`; vẫn đặt được từ Cài đặt), khung xám tóm tắt gợi ý (hạn mức tổng và ba nhóm chi nhiều nhất, "và N
  nhóm khác"), hai nút "Tự đặt" (mở form hạn mức tổng) và "✦ Đặt theo gợi ý"; người chưa có chi 3 tháng thì không có
  khung gợi ý, một nút "Đặt hạn mức". "Đặt theo gợi ý" mở `BudgetSuggestSheet`: một câu giải thích, hạn mức tổng và
  mỗi nhóm là `SettingsFieldRow` có ô tiền gõ tại chỗ, điền sẵn `suggestedLimit` của trung bình 3 tháng ("Trung bình
  4,12tr" dưới tên), xoá trống là không đặt ("Không đặt"), chân "Lưu N hạn mức" lưu tất cả cùng lúc (tất cả hoặc
  không, `saveBudgets`). Sheet Hạn mức khi trống cũng có hai nút đó.
  **Hạn mức tổng và hạn mức nhóm** (2026-10-17, kiểu "A" người dùng chọn): thẻ đầu sheet có đầu riêng (`TotalHeading`:
  ô icon đồng hồ, "Hạn mức tổng", "Mọi khoản chi trong tháng", mũi tên), dưới số tiền là dòng phân bổ dưới vạch kẻ
  ("Đã chia cho nhóm 1,2tr / 1,2tr");
  nhóm dòng bên dưới là "HẠN MỨC THEO NHÓM · N"; thẻ ở Tổng quan ghi "Hạn mức tổng" trên số và "Theo nhóm" trên các
  nhóm. Luật (`limitsConflict`, kiểm cả trong form lẫn server): các hạn mức nhóm cộng lại không vượt hạn mức
  tổng (2026-10-17, lúc đầu chỉ chặn một nhóm vượt tổng, các nhóm cộng lại vượt thì cảnh báo; người dùng thấy 3tr +
  3tr + 6tr dưới tổng 7tr là vô lý): đặt nhóm thì "Hạn mức tổng 7tr chỉ còn chia được 1tr cho Nhà cửa." (hết chỗ: "…
  đã chia hết cho các nhóm khác."), hạ tổng thì "Các nhóm đã chia 7tr. Hạn mức tổng cần từ 7tr, hoặc giảm hạn mức nhóm
  trước."; lỗi hiện ngay khi gõ, nút Lưu tắt; chưa có hạn mức tổng thì không ràng buộc. "Đặt theo gợi ý" bắt đầu hạn mức
  tổng ít nhất bằng tổng các gợi ý nhóm. Form có thêm dòng so sánh: nhóm "Hạn mức tổng · 1,2tr · còn chia được 300k",
  tổng "Đã chia cho nhóm · 1,2tr". Dòng phân bổ chỉ còn hiện amber cho hạn mức đặt trước luật này.
  Gợi ý chỉnh hạn mức không bao giờ đề nghị một nhóm
  quá phần còn chia được, hay hạ tổng dưới phần các nhóm đã chia.
  **Gợi ý chỉnh hạn mức** (2026-10-17, `BudgetAdjustHint`): dưới thẻ đầu của màn nhóm và màn tổng (tháng này), khi
  hạn mức đặt từ trước tháng này, có ít nhất 2 tháng chi trong 3 tháng trước, và trung bình vượt hạn mức hơn 20%
  ("Hạn mức có thể quá thấp", amber) hay dưới nửa hạn mức ("quá cao", xanh `transfer`): "3 tháng gần đây bạn chi
  trung bình 2,9tr cho Ăn uống, hạn mức 300k thường bị vượt." (tổng: "… mỗi tháng, hạn mức tổng …"), `NoticeBanner
  footer` với "Đặt 2,9tr" (`suggestedLimit` của trung bình) và "Để sau" (ẩn tới hết tháng, `budgets.hint_dismissed_month`).
  Dòng nhóm trong sheet có chấm amber 7px sau tên khi nhóm có gợi ý.
  **Cảnh báo hạn mức** (2026-10-17, `BudgetAlertSettingsScreen`; tên đổi từ "Thông báo hạn mức" ngày 2026-10-17 để
  khỏi trùng dòng "Hạn mức chi tiêu" của nhóm Chung): dòng "Cảnh báo hạn mức" ("Bật · 80%", "Bật · khi vượt",
  "Tắt") trong Cài đặt › Thông báo, và dòng cuối sheet Hạn mức cùng tên, cùng mở màn: công tắc "Báo
  khi chạm hạn mức" (chú thích "Báo trên các thiết bị đã bật thông báo."), khi bật thì "BÁO TRƯỚC" là list chọn "Khi
  dùng 80%" / "Khi dùng 90%" / "Không báo trước" (chú thích "Luôn báo khi vượt hạn mức. Mỗi hạn mức báo mỗi mốc một
  lần trong tháng."), và "VÍ DỤ" hai thông báo mẫu theo mốc đã chọn, trên hạn mức đầu tiên của người dùng; tắt thì
  một câu thay. Mỗi lần đổi lưu ngay (`notification_settings.budget_alerts_enabled`, `budget_alert_level`); không
  còn phụ thuộc công tắc "Nhắc ghi chi tiêu".
  **Cảnh báo khi ghi khoản chi** (2026-10-17, "2A", `BudgetHint`): khi số tiền đang gõ làm nhóm của hạng mục đã chọn
  hay hạn mức tổng vượt, dòng dưới lưới hạng mục thành chữ đỏ đậm có ⚠: "Khoản này làm Ăn uống vượt 110k, hạn mức
  tổng vượt 90k" (vẫn lưu được, chỉ báo trước); không vượt thì vẫn là dòng còn lại của nhóm. Không tính khoản
  ngoài báo cáo hay trả bằng hũ; sửa một khoản chi thì trừ số cũ trước khi cộng số mới.
  **Chi tiết** (2026-10-17, `budget-detail.tsx`, `budget-charts.tsx`, dữ liệu `lib/budgets/month.ts`): sheet tên
  "Hạn mức", đầu nội dung là "Tháng 10" với hai nút tròn ‹ › (như lịch ở Tổng quan; lùi tới tháng có giao dịch
  đầu tiên). Thẻ cả tháng kèm `KeptMonths` dưới vạch kẻ, chỉ tính các tháng từ khi đặt hạn mức (`budgets.created_at`;
  2026-10-17, trước đó hạn mức bị áp ngược cho các tháng chưa có nó): "3/4 tháng gần đây trong hạn mức" và mỗi
  tháng một chấm (xanh giữ, đỏ vượt), một tháng thì "Tháng trước: trong hạn mức / vượt hạn mức", chưa tháng nào
  thì không hiện. Hạn mức tổng tính cả phí chuyển khoản và lãi đi vay (2026-10-17, như ô "Chi"); dưới số tiền,
  khi có, "Không tính 450k mua bằng hũ tiết kiệm, 13k điều chỉnh số dư" (`UncountedNote`; ô "Chi" tính hai khoản
  này, nên "Chi" = đã dùng hạn mức tổng + hai số đó). Dòng hạn mức tổng dưới ô Thu/Chi ở trang Giao dịch cũng ghi
  dòng này. Tháng đã qua: thẻ là `BudgetResult`
  ("Tháng 9 đã chi", số lớn, %, thanh, "Trong hạn mức · còn dư 400k" xanh hay "Vượt hạn mức 300k" đỏ), dòng nhóm ghi
  "Còn dư …" / "Vượt …", tiêu đề "THEO NHÓM · 3/4 TRONG HẠN MỨC", rồi "CHƯA ĐẶT HẠN MỨC" là các nhóm khác có chi trong
  tháng đó (số tiền bên phải; nhóm đặt hạn mức sau tháng đó ghi "Đặt từ tháng 10"), rồi "Nhóm đã xoá" (mở danh
  sách khoản chi của các nhóm đó), "Phí chuyển khoản", "Lãi đi vay" ("Chỉ tính vào hạn mức tổng", không mở gì), để
  các phần cộng đủ tổng. Vòng "Theo nhóm" ở màn tổng cũng tách ba phần này (dòng không mở gì thì không có mũi tên). Tháng
  trước khi đặt hạn mức không bị chấm: thẻ chỉ ghi "Tháng 9 đã chi" và "Chưa đặt hạn mức trong tháng này", biểu
  đồ ngày không có vạch hạn mức ("Hạn mức · Chưa đặt"). Tháng cũ so với số hạn mức hiện tại (chưa lưu số theo
  từng tháng). Màu thanh một quy tắc ở mọi nơi (`limitTone`): mực, amber từ mốc báo sớm (`nearLevel`: 80% hay 90% theo
  "Cảnh báo hạn mức", 80% khi tắt hay "Không báo trước") hay khi đang chi nhanh so với
  số ngày đã qua (tháng này), đỏ khi vượt. Chạm thẻ cả tháng hay một nhóm mở màn sâu
  (`PageSheetScreen`, trượt vào, ‹ quay lại, bút chì sửa hạn mức ở bên phải, tháng cũ không có bút chì; tiêu đề "Ăn uống",
  "Ăn uống · tháng 9", "Hạn mức tổng", "Hạn mức tổng · tháng 9"; 2026-10-17 đổi từ "Cả tháng 10": hạn mức cả tháng gọi là "hạn mức tổng" ở mọi chỗ, cả thông báo đẩy): thẻ đầu như trên, "CHI THEO NGÀY" (`BudgetDailyChart`: hai số "Đã chi"
  (hay "Cả tháng 9") / "Hạn mức"; đường chi luỹ kế màu mực, amber khi đang chi nhanh, đỏ khi vượt, nền mờ cùng
  màu; vạch đỏ mờ là hạn mức; không có đường "đúng kế hoạch" (bỏ 2026-10-17: không ai chi đều như thế); đường cong mượt
  (`monotoneX`, không vọt quá hay tụt dưới tổng của ngày; thử bậc thang 2026-10-17 rồi quay lại đường cong vì
  người dùng thấy bậc thang thô); tháng này dừng ở hôm
  nay, tháng cũ chạy tới ngày cuối, đi ngang sau khoản cuối; dưới biểu đồ "Vượt hạn mức từ ngày
  27/09, cả tháng vượt 300k." hay "Cả tháng trong hạn mức, còn dư 350k.", tháng này chỉ khi đã vượt),
  "THEO HẠNG MỤC" (màn nhóm) hay "THEO NHÓM" (màn cả tháng, thêm "Nhóm chưa đặt hạn mức" gom các nhóm không có
  hạn mức, màu xám) là `BudgetSplit` (2026-10-17, thay các dòng có thanh): vòng tròn 160 với tổng ở giữa
  ("Tổng chi"; chạm một lát hiện tên, số tiền và % như vòng ở Tổng quan, không chuyển màn), dưới là mỗi phần một dòng cao 48: chấm màu, tên (nhóm vượt hạn mức có dòng đỏ "Vượt hạn mức nhóm
  …" dưới tên), số tiền, %, mũi tên; màu nhóm là màu của nhóm, màu hạng mục bắt đầu từ màu nhóm rồi theo bảng màu, "SO VỚI CÁC THÁNG TRƯỚC" (`BudgetMonthsChart`: trung bình các tháng
  trước và hạn mức, các cột chỉ từ tháng có giao dịch đầu tiên (tối đa sáu tháng trước và tháng đang xem), cột nhỏ cao
  ít nhất 4px, cột vượt đỏ chỉ từ tháng đặt hạn mức, cột tháng đang xem đậm, vạch hạn mức đứt, chú thích "Cột đỏ: vượt hạn mức. Tháng này tính tới hôm nay."; "Tháng trước" khi
  chỉ có một tháng, "Trung bình N tháng trước" khi nhiều hơn), rồi (màn nhóm) "GIAO DỊCH THÁNG NÀY" (hay "GIAO DỊCH THÁNG 9"): ba khoản chi mới nhất trong một
  nhóm dòng, mỗi dòng ghi ngày giờ ("04/10, 19:56", "Hôm nay, 12:30"), và "Xem tất cả N giao dịch". Danh sách giao dịch mở ngay trong
  sheet, là một màn sâu nữa (`BudgetSpendingList`, 2026-10-17: trước đó nhảy sang trang Giao dịch rồi phải quay lại):
  "Xem tất cả" mở "Giao dịch Ăn uống", chạm một hạng mục ở "Theo hạng mục" mở hạng mục đó ("Ăn trưa"), "Nhóm chưa
  đặt hạn mức" ở màn tổng và các nhóm chưa đặt hạn mức của tháng cũ mở giao dịch của chúng; chỉ các khoản hạn mức
  tính (có hạng mục, trong báo cáo, không trả bằng hũ), đầu danh sách "4 giao dịch · 210.000đ", rồi theo ngày (tiêu
  đề ngày và tổng chi của ngày) bằng `TransactionItem`, chạm mở chi tiết, sửa, xoá như ở trang Giao dịch. ‹ quay
  về màn trước (các màn xếp chồng). Trang Giao dịch vẫn nhận `?group=` để lọc sẵn theo nhóm. Trục số chỉ có 0, nửa hạn mức, hạn mức; khi chi
  vượt xa thì hạn mức và đỉnh.
- **Hũ tiết kiệm** (2026-10-14, `budget/_components/savings/`): hũ là một tài khoản loại `savings` (không lãi, để
  dành mua một món), tiền vào ra là chuyển khoản. Trang Tài khoản có nhóm "HŨ TIẾT KIỆM · N" dưới "TÀI KHOẢN CHÍNH · N" (tên cũ "Đang dùng", đổi 2026-10-14):
  mỗi hũ một dòng, ô đầu là `JarRing` (vòng tiến độ 36 quanh biểu tượng, vòng và biểu tượng theo màu hũ, đầy thì xanh lá),
  dòng phụ "Còn 3 tháng · 5tr/tháng" / "Còn thiếu …" / "Đủ tiền rồi 🎉" (xanh lá), bên phải số đã có và "/ 15tr";
  cuối nhóm "Thêm hũ". Hũ đã mua nằm trong "Hũ đã hoàn thành" (thu gọn, dưới cùng, dòng xám "Đã mua 14/10 ·
  giá"). Thẻ Tổng số dư có dòng "Hũ tiết kiệm" (tối đa 3 icon xếp chồng để số không xuống dòng). Chi tiết hũ
  (`JarSheet`): vòng lớn, tên, số đã có `xl`, "60% của …"; Còn thiếu, Hạn, Mỗi tháng nên nạp (dòng Mục tiêu bỏ 2026-10-16 vì trùng "% của"); "Lịch
  sử" 5 lần gần nhất + "Xem tất cả"; chân sheet "Rút ra" (secondary) và "Nạp vào hũ", đủ tiền thì thông báo xanh
  và "Đã mua". Bút chì mở `JarFormSheet` (cũng là màn tạo; 2026-10-16 bày như màn sửa danh mục): vòng hũ theo lựa chọn,
  Mục tiêu lớn, Tên (người dùng tự gõ), "Biểu tượng" là `IconPicker` của danh mục (gợi ý theo tên, ô cuối mở
  `IconPickerScreen` đủ bộ icon danh mục có ô tìm), "Màu" là `ColorPicker` (màu danh mục; tô cả vòng lẫn biểu
  tượng ở mọi nơi hũ hiện), công tắc "Đặt hạn" + dòng Hạn. Hũ đã hoàn thành chỉ còn vòng đầy, dòng "Đã mua …
  Hũ đã hoàn thành chỉ đổi được tên." và ô Tên (server cũng chỉ đổi tên), cạnh Lưu vẫn có Xoá (`MonthPickerSheet` từ tháng này),
  "Cần nạp khoảng … mỗi tháng để đạt mục tiêu đúng hạn" (Mục tiêu có gợi ý nhập nhanh như ô số tiền khác); thùng rác cạnh Lưu xoá hũ (hỏi lại; các lần nạp, rút bị xoá, tiền
  về tài khoản cũ). `MoveJarSheet`: số tiền lớn + nút điền nhanh "Tháng này · 5tr", "Đủ mục tiêu · 15tr" (rút ra:
  "Rút hết"), Từ/Về tài khoản (màn sâu), thời gian, ghi chú. `BoughtSheet`: Giá mua (mặc định mục tiêu), Hạng
  mục (màn sâu), thời gian; mua rẻ hơn thì "Còn thừa" + "Chuyển về", đắt hơn thì "Thiếu" + "Trả thêm từ"; ghi
  khoản chi từ hũ và hũ sang Đã hoàn thành. Một tên gọi xuyên suốt: "hũ"; đưa tiền vào hũ là "nạp" (2026-10-14).
- **Chi tiết giao dịch** (`TransactionDetailsSheet`), như biên lai: icon lớn, tên, số tiền lớn, ngày
  giờ; Sửa là nút bút chì tròn bên phải thanh. Thông tin dạng nhãn trái, giá trị phải: Tài khoản
  (logo `xs` + tên), Hạng mục (`IconTile xs` + tên), Nhóm; ghi chú xuống dòng đầy đủ. Chuyển khoản
  là thẻ "Từ → Đến" có logo hai bên, rồi Phí và Tổng trừ (chỉ khi có phí; phí trừ cùng số tiền ở
  tài khoản đi). Dưới đó "[Hạng mục] gần đây" (3 giao dịch cùng hạng mục trang đang có), "Ghi lại
  giao dịch này" (mở Giao dịch mới điền sẵn số tiền, tài khoản, hạng mục, phí, ghi chú; ngày là bây
  giờ, qua `TransactionDraft.copyOf`). Xoá nằm trong sheet sửa (2026-10-13, như tài khoản): nút thùng
  rác đỏ tròn cạnh "Lưu thay đổi", hoàn tác 6 giây, không hỏi lại. Điều chỉnh số dư không có sheet sửa
  nên vẫn có "Xoá giao dịch" ở cuối chi tiết. Giao dịch vay nợ không có bút chì, chỉ "Mở trong Vay nợ".
- **Ngày trong lịch thu chi** (Tổng quan, chạm một ngày): page sheet tên ngày ("Thứ Năm, 01/10"), `FlowTiles`
  Tiền vào / Tiền ra của ngày như trang Giao dịch (số giao dịch mỗi chiều dưới số tiền, "Đang tải…" khi chưa
  tới; khoản vay không tính), rồi "N GIAO DỊCH" là các `TransactionItem`.
- **Giao diện** (Cài đặt, `ThemeOptions`), như "Màn hình & Độ sáng" của iOS: một thẻ, trên là hai màn thu nhỏ
  Sáng / Tối cạnh nhau (vẽ bằng token của chính theme đó: `.light` / `.dark` trên hình, nên luôn đúng dù trang
  đang sáng hay tối), tên và vòng chọn dưới mỗi màn, màn đang hiện có ✓; chạm là chọn. Dưới là dòng "Tự động ·
  Theo cài đặt sáng tối của máy" có công tắc; bật thì theo máy (vòng chọn theo màn máy đang dùng), tắt thì giữ
  màn đang hiện. Công tắc gạt ngay, theme đổi sau khi núm trượt xong (500ms): đổi theme tắt mọi chuyển động một
  khoảnh khắc (`disableTransitionOnChange`) và sẽ cắt ngang cú trượt. Dòng ở Cài đặt ghi "Sáng" / "Tối" / "Tự động".
- **Biểu đồ "Thu và chi theo tháng"** (Tổng quan): không có tooltip nổi; chạm một cột tháng (hoặc
  phím mũi tên, đây là radio group) để chọn, mặc định tháng này; hai dòng trong thẻ ghi "Tháng N"
  và "Thu … Chi …"; cột tháng đang chọn được tô nền nhạt, các cột giữ nguyên màu. Cột chi màu `chart-neutral`, không đỏ. Tháng ghi
  Th5…Th10 để khác thứ trong tuần (T2…CN) của lịch.
- **Tính lương** (Cài đặt, `SalaryCalculator`, 2026-10-08), cùng bố cục với form giao dịch: "Lương gross
  mỗi tháng" là số lớn (`CurrencyInput variant="hero"`), dưới là "22 công · 142.045đ/giờ"; rồi các
  nhóm dòng nhập tại chỗ (`SettingsFieldRow`), theo thứ tự ít đổi tới hay đổi: Phụ cấp (chịu thuế,
  không chịu thuế), Ngày công (công chuẩn, nghỉ không lương, giờ mỗi ngày), Bảo hiểm và thuế (người
  phụ thuộc bằng `Stepper`, vùng bằng chip I · II · III · IV, lương đóng BH "Như lương gross" khi
  trống), Tăng ca trong tháng (ba dòng có icon và hệ số, dòng cảnh báo đỏ trượt ra khi quá 40 giờ),
  Mục tiêu ("Muốn thực nhận", rồi "Còn thiếu" / "Đã đạt mục tiêu"; còn thiếu thì nhóm "Cách đạt · chọn
  một": thêm giờ từng loại, ô đỏ khi vượt giới hạn, hoặc lương gross cần). Chú thích gom dưới nhóm, không
  dưới từng ô. Chân sheet là nút "Thực nhận 25.257.045đ ›", luôn trong tầm mắt khi sửa ở bất kỳ đâu;
  chạm mở màn sâu "Bảng lương": số thực nhận lớn ở giữa, thẻ thanh tỷ lệ Nhận · Bảo hiểm · Thuế (đen,
  `warning`, `expense`) có chú thích phần trăm, rồi ba nhóm Thu nhập, Bảo hiểm, Thuế TNCN và ghi chú
  quy định. Số đã nhập nhớ trên máy.
- **Giới thiệu / Hướng dẫn sử dụng** (`WelcomeProvider`, `components/onboarding/welcome.tsx`, 2026-10-09; lần
  đầu vào app và từ "Hướng dẫn sử dụng" ở Cài đặt): màn toàn phần, "Bỏ qua" trên cùng bên phải (mờ đi ở màn
  cuối), rồi `StepFlow` năm màn. Mỗi màn: khối minh hoạ lớn bo 28 trên nền nhạt một màu ý nghĩa (`transfer`,
  `warning`, `ai`, `income`, `expense`), dựng bằng chính khối của app với số giả (`welcome-pictures.tsx`: thẻ tài
  sản ròng và tài khoản; số tiền lớn, lưới hạng mục và dòng tài khoản, thời gian; câu nói với AI thành giao
  dịch; thu chi theo tháng và theo hạng mục; thông báo nhắc tối và dòng vay nợ), không bấm được, trình đọc màn
  hình bỏ qua; dưới là tiêu đề 24 và một câu. Màn AI ghi số lượt của gói Free. Màn cuối "Bắt đầu"; lần đầu thì
  mở tiếp "Thêm tài khoản".
- **Hướng dẫn cài trên iPhone** (`IosInstallSheet`, `components/pwa-install-button.tsx`, 2026-10-09; mở từ
  "Cài ứng dụng" ở Cài đặt, nhiệm vụ ở Tổng quan, trang giới thiệu): sheet đáy nền xám, không ✕ (kéo
  xuống hay "Đã hiểu" để đóng); icon app, "Cài Timi", "N bước để mở như một ứng dụng"; rồi
  từng bước như onboarding: thẻ trắng vẽ nhỏ đúng màn hình của bước (thanh dưới Safari với ••• và
  menu Chia sẻ, danh sách chia sẻ, màn Thêm vào MH chính), chỗ cần chạm viền xanh `transfer`, vòng sáng
  toả ra rồi mờ dần mỗi 1,6 giây (`animate-tap-ring` trong `globals.css`; đứng yên khi giảm chuyển động), dưới thẻ "Bước 2/3", tiêu đề và một dòng gợi ý. Các bước đi
  bằng `StepFlow` (vuốt, chấm, ‹ co giãn, "Tiếp" thành "Đã hiểu" ở bước cuối); mỗi lần mở lại từ bước đầu. Mở trong trình duyệt
  khác (Chrome, Zalo, Facebook…) thì có thêm bước đầu "Mở trang này bằng Safari" với nút "Chép liên kết".
- **Cài đặt:** một cột căn trái, tối đa `md:max-w-2xl`, thẳng với tên trang. Thứ tự: hồ sơ, Lượt AI,
  Chung, Thông báo, Ứng dụng, Quản trị (hoặc Nhà phát triển trên dev server), "Xoá toàn bộ dữ liệu", Đăng xuất cuối;
  hai dòng đỏ mỗi dòng một nhóm riêng. **Xoá toàn bộ dữ liệu** (`WipeDataGroup`, duyệt 2026-10-16): chú thích dưới
  dòng "Tài khoản đăng nhập và gói Pro vẫn được giữ."; mở `PageSheet` "Xoá dữ liệu": ô `IconTile expense` lg, "Xoá toàn
  bộ dữ liệu?" và một câu "không khôi phục được"; nhóm "Sẽ bị xoá" (tài khoản và hũ, giao dịch, khoản vay nợ, danh bạ
  kèm số; hạng mục "Về mặc định"), chú thích "Vẫn giữ: …"; `FormSection` một ô "Gõ XOÁ để xác nhận" (nhận cả XÓA,
  xoa); chân sheet nút `destructive` "Xoá vĩnh viễn" luôn bấm được (nút tắt thì trong suốt, chữ dưới lộ ra), gõ sai
  thì báo lỗi dưới ô. Xoá xong tải lại về Tổng quan, hạng mục mặc định và màn chào như người mới. Hồ sơ chỉ hiển
  thị (avatar, tên, email, nhãn gói `Badge` "Free" xám / "Pro" màu `ai`), không bấm được; màn gói mở từ một chỗ
  duy nhất là dòng "Nâng cấp Pro" / "Gói Pro" cuối nhóm Lượt AI, cạnh số lượt còn lại.
- **Tin từ Timi** (duyệt 2026-10-17, `lib/broadcasts`): admin gửi thông báo tới người dùng từ Quản trị › "Gửi
  thông báo" (giá trị "N đã hẹn"). Màn: nhóm "Đã hẹn" (ô loa `transfer`, `Badge transfer` "Đã hẹn") và "Đã gửi"
  (ô loa xám; bên phải "18/40 đã đọc", "Đang gửi…", hay "Đã thu hồi" với dòng `muted`), mỗi dòng mở màn chi
  tiết trong sheet: nhóm Nội dung, nhóm Kết quả (gửi lúc, kênh, người nhận, "52/55 máy" với "2 lỗi · 1 máy đã
  gỡ", đã đọc kèm %), dòng đỏ "Thu hồi" / "Huỷ hẹn gửi" có chú thích, xác nhận bằng `ActionSheet`. Chân sheet:
  "Soạn thông báo" mở sheet soạn: `FormSection` Nội dung (tiêu đề 60, nội dung 200 kèm bộ đếm, "Khi chạm mở"),
  "Xem trước" (`PushBanner` và dòng chuông như thật), `FormSection` Gửi (kênh là segmented Cả hai · Chuông ·
  Đẩy, người nhận Tất cả · Free · Pro · Mới 30 ngày với số người, số máy, số người đã tắt), công tắc "Hẹn giờ
  gửi" mở ô ngày và giờ; chân sheet "Gửi thử" (`secondary`, chỉ tới máy của admin) cạnh "Gửi tới N người" /
  "Hẹn gửi 08:00 18/10", hỏi lại bằng `ActionSheet` nói số người, số máy. Người dùng: tin hiện trong chuông với
  icon Timi (`TimiIcon` 36 làm `media`), 30 ngày; Thông báo ở Cài đặt có công tắc "Tin từ Timi" (tắt thì chỉ
  không đẩy tới máy) với chú thích dưới nhóm.
- **Desktop:** phần tử trong cột bám (rail) không co lại (`*:shrink-0`); rail cao hơn cửa sổ thì tự
  cuộn. Tài khoản: rail lùi xuống 32 để thẻ dẫn đầu thẳng với thẻ list; cả trang tối đa 64rem
  (68rem từ xl, `budgetPageClassName`), nên nút ở đầu trang thẳng mép phải với list. Thanh bên: "Timi" kèm "Beta" chữ mờ trên cùng dòng.
- **Màn gói** (duyệt 2026-10-07, theo màn "Get more Claude"): page sheet nền xám, tiêu đề lớn giữa
  ("Nâng cấp Timi" / "Bạn đang dùng Pro"); thẻ Pro trước với `ChoiceTiles tone="ai"`
  chọn kỳ (mặc định theo năm), nút `lg` rộng hết, ghi chú nhỏ, rồi đường kẻ và "Mọi thứ của gói
  Free, thêm:"; thẻ Free gọn hơn; cuối là dòng payOS và câu hỏi thường gặp (`Accordion` trong
  `SettingsGroup`). Kết quả thanh toán: đã trả, huỷ, hết hạn là toast một lần (đã trả kèm nút "Ghi khoản chi"), rồi `order` rời khỏi URL; đang chờ xác nhận và trả thiếu là `NoticeBanner` ở đầu, vì vẫn còn đúng tới khi được xử lý. Lúc đang chờ, sheet hỏi lại payOS mỗi 5 giây trong 2 phút (khi app đang hiện); tiền về thì banner thành toast "Đã nâng cấp Pro". Nút nâng cấp mở **sheet thanh toán**
  (`CheckoutSheet`, sheet đáy nền xám, 2026-10-09): ô `IconTile ai` lớn, "Nâng cấp Pro" / "Gia hạn Pro", "300 lượt AI
  mỗi tháng"; biên lai là nhóm dòng: "Gói Pro · 1 năm  249.000đ", "Mã giảm giá" gõ tại chỗ (`SettingsFieldRow`,
  chữ in hoa, "Áp dụng" ở cuối dòng sáng khi đã gõ; mã sai báo đỏ dưới nhóm). Áp được thì dòng mã thành
  `Chip tone="income"` chỉ ghi mã ("SALE20 ×", không kèm phần trăm) và thêm dòng "Giảm 20%  −50.000đ" xanh;
  "Tổng thanh toán" đậm ở thẻ riêng; nút "Thanh toán 199.000đ" rộng hết và dòng nhỏ "Bảo mật qua payOS · quét QR,
  mọi ngân hàng". Mã làm tổng về 0 thì nút là "Nhận Pro miễn phí", không qua payOS. Xác nhận ở Quản trị (thu hồi
  Pro, xoá mã) cũng là `ActionSheet` đỏ.
- **Form:** `PageSheet` nền xám; các trường gom trong một `FormSection` (thẻ trắng, ô nhập
  xám bên trong), dòng chọn và công tắc trong `SettingsGroup`; form `flex flex-1 flex-col`, nút
  lưu cỡ thường rộng hết trong `PageSheetFooter` cuối form, nổi ở đáy sheet (bóng mềm như nút tròn ở thanh trên, ngay trên dải thanh vuốt; nội dung cuộn dưới nó mờ dần tới tận mép dưới). Không bọc một ô lẻ
  trong thẻ riêng. Nút ✕ là cách huỷ, không cần nút "Huỷ"; màn con trong sheet (sửa hạng mục)
  là một `PageSheetScreen`: trượt vào, nút trái thành ‹.
