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
  `--control-radius`, `--control-px` (mặc định 44, 12, 16). `CurrencyInput` (mọi ô số tiền): bàn phím số, nhóm hàng nghìn khi gõ (1.250.000), trong ô chỉ có con số (nhãn đã nói là tiền; không icon, không "đ"); khi đã có số thì nút ✕ ở cuối xoá nhanh, giữ bàn phím; ô có thể âm (`onNegativeChange`) có nút +/− ở đầu. `variant="hero"`: số tiền chính của màn (sheet thêm giao dịch): số 40 đậm ở giữa, không khung, dấu `sign` (− chi, + thu) trước và "đ" mờ sau, ô rộng đúng bằng số nhờ một bản sao vô hình của chữ cùng ô lưới (không ước lượng, nên Safari không cuộn số lệch sau khi gõ), chữ nhỏ dần khi số dài (40 → 30 → 22); khi có số, nút ⊗ xám nhỏ ở mép phải hàng (vùng chạm 44, không đặt sau "đ" để số không lệch tâm) xoá về 0 và giữ bàn phím, gợi ý canh giữa; `tone="income"` tô xanh. Dưới ô luôn có chip gợi ý (`suggestions`, mặc định bật, `false` để tắt): gõ 3 thì 3.000đ, 30.000đ, 300.000đ…; truyền `history` (số tiền cũ, mới nhất trước) thì ô trống gợi ý các số hay dùng và số cũ khớp chữ số lên trước. Gợi ý theo số đã gõ, không theo số vừa chọn, nên chọn một chip thì hàng đứng yên và chip đó được tô; form đặt lại giá trị (mở lại sheet) thì gợi ý cũng xoá. Lỗi dưới một cặp ô (Từ / Đến) cách ô 8px như lỗi dưới một ô. `InputGroup variant="search"`: ô tìm kiếm đứng riêng (trang Giao dịch), tròn như nút
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
| `Money` | Mọi số tiền: chữ số đều, "đ" viết liền sau số (55.103.000đ); ở cỡ lớn (`lg`, `xl`) "đ" nhỏ hơn và mờ 50% như mockup; cỡ `sm` 14 / `md` 16 / `lg` 20 / `xl` 34, màu theo `tone` (`muted` cho số không còn tính, như số dư tài khoản đã lưu trữ). Số âm luôn viết bằng dấu trừ "−", không phải gạch nối, cả ở `formatCurrency` và `formatCompactCurrency`. `fit`: cho ô hẹp có độ rộng cố định (FlowTiles): số luôn một dòng, co theo `@container` gần nhất từ cỡ của nó xuống 3/4 (lg: 20 → 15), vẫn không vừa thì viết gọn (+125tr, −1,25tỷ); luôn chỉ một dạng hiện, số đầy đủ cho trình đọc màn hình và tooltip. Trình duyệt không có `round()` hay `cqi` (iOS 15, Chromium cũ) thì chỉ hiện số đầy đủ. Lưu ý: Be Vietnam Pro không có chữ số đều (`tnum`), nên `tabular-nums` không có tác dụng |
| `IconTile` | Icon trên ô vuông bo góc nền nhạt (như mockup); màu hạng mục hoặc màu ý nghĩa, làm dịu về xám với icon màu mực (`tile-tinted`, 2026-10-08). Cỡ `xs` 20 (bo 6) đứng trước giá trị ở cuối dòng, ngang `AccountLogo xs`; Cỡ `sm` 36 (mọi dòng list, qua `SettingsRow`), `md` 40 (bo 10), `lg` 48 (bo 16; đầu thẻ, đầu sheet); `shape="circle"` chỉ cho chữ cái, khuôn mặt |
| `DeltaBadge` | % thay đổi so với kỳ trước, dạng chữ nhỏ có mũi tên ("↘ 93%") như mockup, không nền; xanh khi tốt, đỏ khi xấu |
| `StatGroup` + `Stat` | 2–4 chỉ số chia cột bằng vạch mảnh, mỗi cột có thể mở trang |
| `ProgressRing` | Tiến độ dạng vòng mảnh có số ở giữa. Mỗi lần vòng hiện ra (tải trang hay mở từ thanh tab), cung vẽ trống rồi quét từ 12 giờ tới giá trị trong 0,9 giây (dừng chậm dần); đổi giá trị thì cung chạy tiếp tới giá trị mới. Giảm chuyển động: hiện ngay |
| `FormSection` | Các trường của một form trong thẻ trắng, có tiêu đề nhỏ, ghi chú và nội dung phụ bên dưới |
| `PromoBanner` | Thẻ sáng cho một điều đáng chú ý, như lời mời Pro (dưới tài sản ròng ở Tổng quan, khi đã xong nhiệm vụ): ô icon `lg` màu `tone` (mặc định `ai`), tiêu đề, một dòng, mũi tên. Sáng để không tranh với thẻ dẫn đầu. Luôn rộng hết chỗ chứa; nơi dùng không đặt độ rộng |
| `FloatingActions` | Nút hành động chính nổi phía trên thanh tab, trên điện thoại; tự chừa một khoảng cuối trang để dòng cuối cuộn lên khỏi nút. `FloatingActionsSkeleton`: nút + đứng sẵn chỗ trong màn tải, không bấm được, để khỏi bật ra khi trang tới |
| `MobileBottomNav` | Thanh tab nổi trên điện thoại (`components/mobile-bottom-nav.tsx`): viên thuốc mờ rộng ngang màn hình (tối đa 28rem), mỗi tab chỉ có icon 24 (bỏ tên dưới icon theo yêu cầu, 2026-10-08; tên vẫn là nhãn cho trình đọc màn hình, và đầu trang luôn ghi tên trang); viên xám nhạt trượt tới tab đang mở, tab đó icon nét đậm màu chữ. Mỗi tab nhớ vị trí cuộn (theo URL, kể cả query; trang con như /design, /settings/plan luôn mở ở đầu); chạm lại tab đang mở thì cuộn về đầu (mượt, tức thì khi giảm chuyển động); trượt ngón ra khỏi tab trước khi nhấc thì huỷ |
| `PageHeader` | Đầu mọi trang (`components/page.tsx`), kiểu app ngân hàng Việt Nam (Cake, Timo), chọn 2026-10-08: một hàng cao 44 (64 từ md), cuộn cùng trang (không dính, không thu gọn). Bên trái tên trang 24 đậm 600, hoặc `lead` thay chỗ đó (Tổng quan: avatar, lời chào theo giờ, tên đầy đủ, mở Cài đặt; tên trang vẫn là h1 cho trình đọc màn hình). Bên phải: `tools` (mọi cỡ: tháng, chuông), `accessory` (nút tròn 44, dạng điện thoại của `actions`: dưới md khi có `actions`), `actions` (nút có chữ từ md). Cách nội dung 16 trên điện thoại. `PageHeaderSkeleton` hiện tên trang thật. Số đếm không nằm ở đầu trang mà trong tiêu đề nhóm ("ĐANG DÙNG · 3") |
| `InlineSelect` | Dropdown mở tại chỗ, đẩy nội dung bên dưới xuống: chọn trong vài tài khoản, ví. Hiệu ứng chiều cao đơn giản (300ms ease-out); trên iOS kém mượt hơn transform, đã chấp nhận. Danh sách dài vẫn dùng `Select`/`Combobox` |
| `CardLabel` | Nhãn nhỏ trong thẻ ("Tài sản ròng", "Tiền vào"): chữ thường cỡ Body, màu phụ; trên thẻ `inverse` thì sáng 60%. Mọi thẻ có nhãn dùng nó |
| `Avatar` | Ảnh người dùng, không có ảnh thì chữ cái đầu. `AvatarFallback colorKey={id}` cho chữ cái nằm trên màu riêng của người đó (bảng màu hạng mục, trừ hồng và xám; cùng hàm `personTileClassName` với `ContactAvatar`), như hồ sơ ở Cài đặt và Tổng quan; không có thì nền xám |
| `Chip` | Chip tĩnh cho thứ đã chọn hoặc gắn kèm (người, thẻ #): có thể có avatar và nút × |
| `Collapse` | Thu gọn và mở lại một khối: chiều cao (hoặc rộng, `axis="x"`) trượt về 0 kèm mờ dần trong 300ms, phần bên dưới trôi lên mượt thay vì nhảy; khi đóng vẫn giữ trong cây nhưng `inert`. Dùng cho màn tìm ở Giao dịch (đầu trang và thẻ tổng thu lại, "Huỷ" trượt ra). Tức thì khi giảm chuyển động |
| `ChipRow` | Hàng chip cuộn ngang, chạy tới mép màn (bù `--main-content-px`), chip đầu vẫn thẳng hàng trang; có chừa 4px trên dưới cho viền focus. Đi kèm `ChipButton` (chip mở một thứ, như sheet lọc; `active` tô đậm khi điều kiện đang bật, ghi "Lọc · 2") và `ChipRowDivider` (vạch đứng giữa nút lọc và các chip loại). Chip chọn là `ToggleGroup` `size="sm"`. Chip đổi màu tức thì, không chuyển màu (chuyển trắng sang đen đi qua xám, và khựng lại thành nháy khi trang đang bận); chip lọc ở Giao dịch hiện chọn ngay rồi mới lọc trang trong transition |
| `MonthPickerSheet` | Chọn tháng từ sheet đáy: năm với ‹ ›, lưới 12 tháng, tháng chưa tới mờ đi, nút "Tháng hiện tại" (cỡ thường, đen). Nền xám như mọi sheet (`DrawerContent surface="grouped"`, nay dùng được cả cho sheet đáy ngắn), ô tháng trắng; action sheet thì vẫn là khối trắng nổi trên lớp phủ như iOS |
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
| `usePageSheetScreen` | Màn sâu hơn trong một `PageSheet`, mở từ bên trong (danh sách hạng mục, danh sách tài khoản của form giao dịch): khi đặt `{ title, onBack }`, thanh trên đổi tiêu đề và nút trái thành ‹, nút phải và chân sheet ẩn, nội dung về đầu; quay lại thì thanh trở lại và nội dung về chỗ cũ. Nơi gọi tự hiện nội dung màn sâu và ẩn (không gỡ) màn đầu để giữ những gì đã nhập |
| `SettingsRow checked` | Dòng của list chọn như iOS: ✓ ở cuối khi đang chọn, không có gì khi không, không có mũi tên; chạm là chọn (`onClick`), trình đọc màn hình nghe nút bật/tắt (`aria-pressed`). Dùng cho các màn chọn trong sheet lọc Giao dịch |
| `SettingsRow unread` | Dòng chưa đọc: chấm `transfer` 12px trên góc phải trên của ô icon như chấm trên icon app, viền 2px màu thẻ cắt nó khỏi ô (dòng không icon: chấm 8px trước tiêu đề), tiêu đề đậm 600; trình đọc màn hình nghe thêm "chưa đọc". Đọc rồi thì như mọi dòng. Dùng cho Thông báo; giờ ở `value` theo `formatMomentLabel` (hôm nay "14:05", "Hôm qua", cũ hơn "05/10") |
| `SettingsRow collapsed` | Dòng gập lại (`true`) hay mở ra (`false`): chiều cao trượt trong 300ms và mờ dần, nên các dòng bên dưới dịch dần thay vì nhảy; khi gập thì `inert`. Cho dòng hiện khi người dùng yêu cầu (nhiệm vụ còn lại sau "Xem nhiệm vụ") và dòng rời đi khi xong (nhiệm vụ vừa nhận thưởng). Không truyền với dòng luôn hiện. Đường kẻ tự theo: dòng đầu tiên đang hiện không có kẻ phía trên |
| `ActionSheet` | Danh sách lựa chọn ngắn trồi từ đáy, Huỷ tách riêng bên dưới (vaul) |
| `NoticeBanner` | Thông báo trong trang trên nền nhạt theo `tone`, đóng được (`onDismiss`), hoặc bấm cả khối kèm mũi tên để mở thứ nó nói tới (`onClick`), hoặc kèm một nút nhỏ ở cuối cho bước tiếp theo (`action`, như "Ghi khoản chi" sau khi thanh toán gói). `surface="card"`: thẻ trắng như một dòng list (cao 64, bo 20), màu chỉ ở ô icon và tiêu đề, cho cảnh báo nằm giữa các list; khoản quá hạn ở Vay nợ dùng `tone="expense"`, đỏ như chữ "Quá N ngày" ở dòng nợ, thay cho nền be |
| `PageSheet` | Sheet dùng chung của app, kiểu page sheet iOS (`Drawer variant="page"`): thanh trên cùng có nút ✕ tròn (cách mép trên và trái 16), tiêu đề nhỏ ở giữa (kiểu chính), `action` bên phải (nút tròn, hoặc như ✓✓ "Đánh dấu tất cả đã đọc" ở Thông báo; hoặc nút có chữ `secondary` cỡ thường: cao 44 và nổi như ✕); các nút tròn trên thanh luôn có bóng mềm (theme tối: viền mảnh), lúc mở cũng như khi cuộn. `hideTitle` chỉ cho sheet cần tiêu đề lớn trong nội dung (màn gói). Nội dung cuộn xuyên dưới thanh, như sheet của app Claude: khi đã cuộn, một lớp màu nền sheet phủ từ mép trên qua cả thanh, đậm nhất ở mép trên rồi nhạt dần về 0 ở 16px dưới thanh, không có đường kẻ; sau tiêu đề lớp phủ giữ dày qua dòng chữ. `footer` (một nút cỡ thường, rộng hết) nổi trên cuối nội dung với lớp mờ tương tự từ mép dưới lên qua nút; nội dung chừa đúng chiều cao chân nên dòng cuối cuộn lên khỏi nút. Nền mặc định `grouped` (xám như trang, thẻ trắng và nhóm dòng trên đó, form dùng `FormSection`); `plain` (trắng) chỉ cho sheet là một form trần. Thanh trạng thái giữ màu nền app khi mở mọi lớp phủ (sheet, hộp thoại) nhờ `<html>` cũng mang màu nền: dưới lớp phủ mờ iOS lấy màu của gốc trang. Dùng cho màn gói, Thông báo. Trong `/design` (mục Feedback & Overlay) có sheet mẫu tổng hợp (`sheet-playground.tsx`): đổi ngay trong sheet giữa tiêu đề trên thanh và tiêu đề lớn, nền xám và trắng, bật tắt nút phải và nút chân; kèm khối tóm tắt, segmented, form, dòng, công tắc, thông báo, danh sách dài, dòng xoá |
| `ChoiceTiles` | Vài ô cạnh nhau, chọn một, như bảng giá: vòng radio ở đầu, chip đối diện (ngắn, như "Giảm 28%"), rồi con số và một dòng mô tả. Radio group bên dưới (phím mũi tên, trình đọc màn hình). `tone="ai"` tô ô đang chọn màu `ai` (kỳ thanh toán Pro); mặc định viền đen |
| `FlowTiles` | Tiền theo hai chiều (Tiền vào / Tiền ra ở Giao dịch, Cần thu / Cần trả ở Vay nợ) là hai nửa của một thẻ, chia bằng vạch mảnh thụt 16 trên dưới (như Figma). Mỗi nửa là `@container`, số tiền dùng `Money fit` nên không bao giờ ngắt giữa số: ô icon, nhãn, số tiền `lg` có dấu (chỉ tiền vào có màu) và ghi chú; không có `onValueChange` thì thẻ chỉ hiển thị số, như ở Giao dịch (lọc bằng hàng chip) và Vay nợ (danh sách đã chia sẵn Cần thu / Cần trả); có thì chạm một nửa để danh sách chỉ còn chiều đó (nửa đó nền xám, nửa kia mờ đi), chạm lại để bỏ, hiện chưa trang nào dùng. `FlowTilesSkeleton` cho màn tải |

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
  chính, ba phần chia cột), nhiệm vụ, rồi các `Section`: sắp đến hạn, tháng (chỉ lịch), theo hạng
  mục (biểu đồ tròn, không list), thu và chi theo tháng. Lời mời Pro (gói Free) đi cùng thứ khác
  cho thêm lượt AI: dòng cuối của thẻ nhiệm vụ khi còn nhiệm vụ; nhận hết thì thẻ nhiệm vụ biến
  mất và `PromoBanner` Pro đứng vào chỗ đó, ngay dưới tài sản ròng. Đổi tháng ở lịch (‹ ›)
  thì lưới ngày trượt ngang theo hướng bấm (tháng sau vào từ phải), hàng thứ đứng yên. Các khối
  cách nhau 24px.
- **Trang danh sách** (Giao dịch, Tài khoản, Vay nợ, Cài đặt): đầu trang, thẻ dẫn đầu, rồi các
  `SettingsGroup` có tiêu đề nhóm. Ngày ghi "Hôm nay, 08/10", "Hôm qua, 07/10", rồi "Thứ Ba,
  06/10" (`formatDayLabel`); bên phải tiêu đề ngày là tổng vào (xanh) và tổng ra của ngày;
  tiêu đề ngày bám khi cuộn, thành một dải cao 44. Ô tìm ở Giao dịch nằm trong `<form
  role="search">`: phím Tìm trên bàn phím ẩn bàn phím (kết quả lọc ngay khi gõ).
- **Lọc và tìm ở Giao dịch** (điện thoại): thẻ Tiền vào / Tiền ra chỉ hiển thị; dưới ô tìm là
  `ChipRow`: chip "Lọc" mở sheet điều kiện khác (không có loại), vạch chia, rồi Tất cả · Tiền vào · Tiền ra · Chuyển khoản · Vay nợ. Sheet lọc
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
  chữ, kết quả là một list phẳng, mới nhất trước: chữ khớp tô nền `warning/25`, bên phải ghi
  ngày thay giờ (năm khác thì có năm); trên list là "N kết quả trong Tháng 10 · tổng …" và "Tìm
  mọi tháng" (tải mọi giao dịch khi cần, `loadAllTransactionsAction`). Không có kết quả: nói đã
  tìm gì, ở đâu, đang lọc gì, kèm "Bỏ lọc" và "Tìm mọi tháng". Desktop giữ bảng lọc bên trái
  trên một màn: loại, số tiền (cùng các mức, "Tuỳ chỉnh" trượt mở hai ô), tài khoản có logo và
  hạng mục có icon màu trên chip; kết quả tìm cũng là list phẳng như trên.
- **Thêm / sửa giao dịch** (`TransactionForm`, dùng chung cho Thêm, Sửa và Ghi lại), như app tiền:
  bộ chọn Chi tiền · Thu tiền · Chuyển khoản, số tiền lớn (`CurrencyInput variant="hero"`, bàn phím
  chờ chạm vào số) và gợi ý; chi/thu có lưới hạng mục 4 cột (7 hay dùng nhất, đang chọn viền
  đậm, ô cuối "Tất cả" mở màn sâu chia theo nhóm, cuối có "Quản lý hạng mục"), rồi một nhóm dòng:
  Tài khoản (logo, mở màn sâu chọn tài khoản có số dư), Thời gian ("Hôm nay, 20:02", chip Hôm nay
  · Hôm qua · Hôm kia, chạm dòng mở ô ngày giờ của máy), ghi chú gõ tại chỗ "Ghi chú (tuỳ chọn)",
  tự cao dần. Chuyển khoản: thẻ Từ ⇄ Đến có logo (nút giữa đổi chiều), phí gập thành "+ Thêm phí
  chuyển khoản". Không dấu \* bắt buộc; lỗi hiện tại chỗ (số tiền, khung lưới đỏ, dòng đỏ).
- **Chi tiết giao dịch** (`TransactionDetailsSheet`), như biên lai: icon lớn, tên, số tiền lớn, ngày
  giờ; Sửa là nút bút chì tròn bên phải thanh. Thông tin dạng nhãn trái, giá trị phải: Tài khoản
  (logo `xs` + tên), Hạng mục (`IconTile xs` + tên), Nhóm; ghi chú xuống dòng đầy đủ. Chuyển khoản
  là thẻ "Từ → Đến" có logo hai bên, rồi Phí và Tổng trừ (chỉ khi có phí; phí trừ cùng số tiền ở
  tài khoản đi). Dưới đó "[Hạng mục] gần đây" (3 giao dịch cùng hạng mục trang đang có), "Ghi lại
  giao dịch này" (mở Giao dịch mới điền sẵn số tiền, tài khoản, hạng mục, phí, ghi chú; ngày là bây
  giờ, qua `TransactionDraft.copyOf`), cuối cùng "Xoá giao dịch" (hoàn tác 6 giây). Giao dịch vay nợ
  không có bút chì, chỉ "Mở trong Vay nợ".
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
- **Form:** `PageSheet` nền xám; các trường gom trong một `FormSection` (thẻ trắng, ô nhập
  xám bên trong), dòng chọn và công tắc trong `SettingsGroup`; form `flex flex-1 flex-col`, nút
  lưu cỡ thường rộng hết trong `PageSheetFooter` cuối form, nổi ở đáy sheet. Không bọc một ô lẻ
  trong thẻ riêng. Nút ✕ là cách huỷ, không cần nút "Huỷ"; màn con trong sheet (sửa hạng mục)
  dùng `onBack` để nút trái thành ‹.
