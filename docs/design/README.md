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
2. **Một màu nhấn.** `neutral-900` (trắng ở theme tối) cho nút chính, chip đang chọn, công tắc
   bật, tiến độ.
3. **Chữ nhẹ.** Chỉ dùng `font-normal` và `font-medium`, kể cả tiêu đề lớn của trang.
4. **Màu mang ý nghĩa.** `income` tiền vào (emerald), `expense` tiền ra (rose), `transfer`
   chuyển khoản (sky), `ai` AI và Pro (xanh ngọc), `warning` nhắc nhở (amber). Chỉ tô số tiền,
   icon, badge; nền nhạt dùng độ mờ (`bg-income/10`). Trong danh sách giao dịch chỉ khoản thu có
   màu, khoản chi để màu chữ thường, như mockup.
5. **Vừa ngón tay.** Thứ bấm được cao từ 44px. Mọi nút là viên thuốc. Chạm thì hơi lún
   (thu nhỏ 0.97), tắt khi người dùng giảm chuyển động.
6. **Ít chữ.** Nhãn, mô tả, thông báo ngắn và dễ hiểu, giọng trung tính ("Thêm tài khoản", không
   "Chỉ cần…", "Ví dụ…"). Mô tả dưới dòng chỉ ghi điều tiêu đề chưa nói hoặc điều cần làm trước.
   Một thứ gọi một tên trong cả app: "hạng mục", "lượt AI".

## Nền tảng

| | Giá trị |
|---|---|
| Font | Be Vietnam Pro; số tiền `tabular-nums` |
| Cỡ chữ | Theo mockup: Display 28 (tiêu đề trang) · Title 20 (tiêu đề nhóm) · Headline 16 (tiêu đề thẻ, hộp thoại, trạng thái trống) · Body 14 (nội dung, dòng list, nút, nhãn ô) · Caption 12 (mô tả dòng, lỗi và ghi chú dưới ô). Số tiền lớn 34; chữ trong ô nhập 16 để iOS không phóng to |
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
  sản ròng". `variant="inverse"`: thẻ đen (sáng ở theme tối) cho một con số dẫn đầu như số dư.
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
- **Tabs:** segmented control dạng viên thuốc cao 52 (lựa chọn 44), viên đen (trắng ở theme tối)
  trượt tới lựa chọn, chữ lựa chọn chưa chọn `neutral-500`. Dùng cho 2–4 chế độ cùng loại (Chi/Thu/Chuyển). `variant="line"`: tab gạch chân,
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
- **Progress:** thanh dày 8. **Empty:** icon mảnh trong ô vuông xám 80 bo 20, tiêu đề 16.
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
| `Section` | Một phần có tiêu đề ngoài thẻ (`SectionHeader`: 20px, đậm vừa, kèm ghi chú và "Xem tất cả" hoặc nút); nội dung cách tiêu đề 8, các thứ bên trong cách nhau 12. Phần có tiêu đề lớn luôn dùng nó |
| `Money` | Mọi số tiền: chữ số đều, "đ" viết liền sau số (55.103.000đ); ở cỡ lớn (`lg`, `xl`) "đ" nhỏ hơn và mờ 50% như mockup; cỡ `sm`/`md`/`lg`/`xl`, màu theo `tone` |
| `IconTile` | Icon trên ô vuông bo góc nền nhạt (như mockup); màu hạng mục hoặc màu ý nghĩa. Cỡ `sm` 36 (mọi dòng list, qua `SettingsRow`), `md` 40 (bo 10), `lg` 48 (bo 16; đầu thẻ, đầu sheet); `shape="circle"` chỉ cho chữ cái, khuôn mặt |
| `DeltaBadge` | % thay đổi so với kỳ trước, dạng chữ nhỏ có mũi tên ("↘ 93%") như mockup, không nền; xanh khi tốt, đỏ khi xấu |
| `StatGroup` + `Stat` | 2–4 chỉ số chia cột bằng vạch mảnh, mỗi cột có thể mở trang |
| `ProgressRing` | Tiến độ dạng vòng mảnh có số ở giữa |
| `FormSection` | Các trường của một form trong thẻ trắng, có tiêu đề nhỏ, ghi chú và nội dung phụ bên dưới |
| `PromoBanner` | Banner đen (sáng ở theme tối) cho một điều đáng chú ý, như gói Pro |
| `FloatingActions` | Nút hành động chính nổi phía trên thanh tab, trên điện thoại; tự chừa một khoảng cuối trang để dòng cuối cuộn lên khỏi nút |
| `MobileBottomNav` | Thanh tab nổi trên điện thoại (`components/mobile-bottom-nav.tsx`): viên thuốc mờ rộng ngang màn hình (tối đa 28rem), không chữ (tên tab là `aria-label`); viên đen (trắng ở theme tối) trượt tới tab đang mở |
| `CompactTitleBar` | Tiêu đề thu nhỏ khi tiêu đề lớn cuộn đi; tự gắn trong `PageHeader` |
| `InlineSelect` | Dropdown mở tại chỗ, đẩy nội dung bên dưới xuống: chọn trong vài tài khoản, ví. Hiệu ứng chiều cao đơn giản (300ms ease-out); trên iOS kém mượt hơn transform, đã chấp nhận. Danh sách dài vẫn dùng `Select`/`Combobox` |
| `CardLabel` | Tiêu đề nhỏ trong thẻ ("TÀI SẢN RÒNG", "ĐÃ CHI"): chữ hoa 12, đậm 600, giãn chữ nhẹ, màu phụ; trên thẻ `inverse` thì sáng 60%. Mọi thẻ có nhãn dùng nó |
| `Chip` | Chip tĩnh cho thứ đã chọn hoặc gắn kèm (người, thẻ #): có thể có avatar và nút × |
| `MonthPickerSheet` | Chọn tháng từ sheet đáy: năm với ‹ ›, lưới 12 tháng, tháng chưa tới mờ đi, nút "Về tháng này" |
| `MonthSelect` | Tháng đang xem dạng nút viên thuốc "Tháng 10, 2026 ▾", chạm mở `MonthPickerSheet`; tới tháng nào cũng hai chạm. Một cách đổi tháng duy nhất cho trang có tháng, không kèm mũi tên ‹ › |
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
| `NoticeBanner` | Thông báo trong trang trên nền nhạt theo `tone`, đóng được (`onDismiss`), hoặc bấm cả khối kèm mũi tên để mở thứ nó nói tới (`onClick`, như khoản quá hạn ở Vay nợ) |
| `FlowTiles` | Hai thẻ cạnh nhau cho tiền theo hai chiều (Tiền vào / Tiền ra ở Giao dịch, Cần thu / Cần trả ở Vay nợ): số tiền và ghi chú; chạm để danh sách chỉ còn chiều đó, thẻ đang chọn thành `inverse`, chạm lại để bỏ |

Danh sách nằm ở `components/settings-list.tsx`. `SettingsGroup` là nhóm dòng trong một thẻ
(`size="lg"` cho trang dạng bảng tin); đường kẻ giữa các dòng thụt 16 vào từ hai bên. `SettingsRow` là **mọi** dòng list (cài đặt, giao dịch, nhiệm vụ…), nên các list đồng nhất: cao 64
(một dòng hay tiêu đề + mô tả đều vậy), lề ngang 16, `icon` tự đặt trong `IconTile` cỡ `sm` (36,
bo 12) màu theo `tone` (xám nếu không truyền), tiêu đề 14 (Body), mô tả 12, rồi giá trị, công tắc, số
tiền hoặc mũi tên ở bên phải. `media` cho avatar và logo tài khoản (`AccountLogo`: ô vuông bo 10 cỡ 36 như `IconTile sm`, logo trên nền trắng, tiền mặt là tờ tiền xanh; `size="xs"` 20 trong select). `swipeAction` cho dòng vuốt để xoá. Dòng ở
trang Cài đặt mỗi mục một `tone`, như mockup. `SettingsGroup collapsible`: nhóm ẩn dòng tới khi cần (khoản đã tất toán, tài khoản ngừng dùng); tiêu đề vẫn thẳng hàng với các nhóm khác, cuối tiêu đề là "Hiện …" / "Ẩn".

Utility `pressable` (trong `globals.css`) cho phản hồi chạm của thẻ và ô bấm được không phải
`Button`.

## Mẫu màn hình

- **Trang dạng bảng tin** (Tổng quan, duyệt 2026-10-07): lời chào và chuông thông báo, banner Pro,
  nhiệm vụ, thẻ tài sản ròng (nhãn `CardLabel` rồi con số chính), rồi các `Section`: tháng (chỉ
  lịch), theo hạng mục (biểu đồ tròn, không list), thu và chi theo tháng. Các khối cách nhau 24px.
- **Trang danh sách** (Giao dịch, Tài khoản, Vay nợ, Cài đặt): tiêu đề lớn, thẻ tóm tắt, rồi các
  `SettingsGroup` có tiêu đề nhóm.
- **Form:** sheet `screen` nền xám với `SheetNavHeader`; các trường gom trong một `FormSection`
  (thẻ trắng, ô nhập xám bên trong), dòng chọn và công tắc trong `SettingsGroup`; một nút `lg`
  rộng hết ở cuối. Không bọc một ô lẻ trong thẻ riêng. Nút quay lại là cách huỷ, không cần nút
  "Huỷ".
