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
