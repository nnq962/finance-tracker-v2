# Thiết kế giao diện

Nơi lưu mockup đã được duyệt và quy ước của hướng thiết kế hiện hành cho Finance Tracker
(token, kiểu chữ, khối giao diện kiểu app). Quy tắc chung nằm trong
[`web/AGENTS.md`](../../web/AGENTS.md).

Đang thiết kế lại từ đầu (tháng 10/2026): bộ Chunky UI cũ đã được gỡ; nền hiện tại là
preset shadcn `b27GcrRo` với font Be Vietnam Pro. Bảng màu: [`colors.md`](colors.md).

## Khung app trên điện thoại (`web/components/app`)

- **Thanh tab dưới** (`components/mobile-bottom-nav.tsx`): viên thuốc nổi cách mép 16px, nền
  `bg-card/80` có blur và bóng mềm; viên chỉ báo `bg-muted` trượt theo tab đang chọn. Chiều
  cao nó chiếm được giữ trong biến `--tab-bar-space` trên khung app, để cuối trang cuộn lên
  được trên thanh tab.
- **Tiêu đề lớn thu gọn** (`CompactTitleBar`, tự gắn trong `PageHeader`): khi tiêu đề lớn cuộn
  khỏi màn hình, một thanh mờ 44px với tiêu đề nhỏ hiện ở đầu, như iOS.
- **Nút nổi** (`FloatingActions`): hành động chính của trang, ở góc phải dưới ngay trên thanh
  tab; nút chính ở dưới cùng. Từ md trở lên, hành động nằm ở tiêu đề trang.
- **Ô icon** (`IconTile`): icon trên ô nền nhạt, mặc định tròn 40px; `tone` là màu hạng mục
  hoặc màu ý nghĩa (`income`, `expense`, `transfer`, `ai`, `warning`, `neutral`). Là điểm
  nhìn đầu tiên của một dòng list: mắt nhận ra hạng mục bằng màu trước khi đọc chữ. Dùng ở
  dòng giao dịch (bước 1, phương án A được duyệt 2026-10-05).
- **Số tiền** (`Money`): con số đậm, `tabular-nums`, chữ "đ" nhỏ (0.7em) và nhạt; dấu − / +
  theo `sign`, màu theo `tone` (`income`, `expense`, `transfer`). Cỡ `sm` cho dòng list, `lg`
  cho số thống kê, `xl` cho số tổng. Dùng ở Thu chi trong tháng, Tổng số dư và dòng giao
  dịch (bước 2, phương án A được duyệt 2026-10-05).
- **Badge thay đổi** (`DeltaBadge`): viên nhỏ có mũi tên và % thay đổi; xanh khi tốt, đỏ
  khi xấu (`goodWhen`), xám khi không đổi, ẩn khi không có số để so. Ở Thu chi trong tháng,
  tháng đang chạy so với cùng kỳ tháng trước, tháng đã qua so với trọn tháng trước (bước 3).

## Phong cách trang dạng bảng tin (Tổng quan, duyệt 2026-10-06)

Theo mockup "Mobile Finance Dashboard Design" (Figma Make), áp dụng đầu tiên cho trang Tổng quan.

- **Thẻ lớn** (`Card size="lg"`, `SettingsGroup size="lg"`): bo 28px, đệm 24px, không viền,
  không bóng. Các thẻ cách nhau 16px trên điện thoại, 24px từ md.
- **Nhãn trong thẻ:** chữ nhỏ xám (`text-sm text-muted-foreground`) ở đầu thẻ, rồi con số
  hoặc tiêu đề chính. Tiêu đề section ngoài thẻ dùng `SectionHeader` (`text-xl`, đậm vừa).
- **Độ đậm:** không quá `font-medium`; số tiền dùng `Money weight="medium"`.
- **Nút chính dạng viên thuốc:** `Button size="xl" shape="pill"` (cao 44px, màu `primary`);
  nút tròn `size="icon-xl" shape="pill"` (44px), `variant="secondary"` khi nằm trong thẻ.
- **Banner nổi bật** (mời lên Pro): nền `primary` chuyển sang `primary/85`, chấm mờ, đảo màu ở
  theme tối.
- **Chỉ số chia cột:** 2–3 cột ngăn bằng `divide-x`, số ở trên, nhãn `text-xs` xám ở dưới.
- **Tiến độ dạng vòng mảnh** (nhiệm vụ) và **donut mảnh** (phân bổ); danh sách nhóm dưới donut
  là dòng có `IconTile` bo góc 48px, thanh tỉ lệ 4px màu nhóm, số tiền và % bên phải.
- **Phản hồi chạm:** utility `pressable` (thu nhỏ 0.97 khi nhấn, tắt khi giảm chuyển động)
  cho thẻ và ô bấm được.
