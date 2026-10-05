<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Quy tắc giao diện

### Định hướng: app, không phải web

- Finance Tracker là một PWA dùng chủ yếu trên điện thoại. Giao diện phải mang cảm giác app native: thiết kế cho điện thoại trước (khung 390px), desktop là bản mở rộng.
- Đặc trưng nên có: tiêu đề lớn, list chia nhóm tràn mép với tiêu đề nhóm bám khi cuộn, dòng list cao và dễ chạm, chip/segmented control thay cho form lọc, bottom sheet thay cho dialog, nút nổi trong tầm ngón cái, phản hồi khi chạm (`active:`) thay cho hiệu ứng hover. Tránh card lồng card, khung viền bao quanh mọi thứ và bố cục kiểu trang web.
- Nguồn chuẩn về thiết kế: `docs/design/minimal.md` (giao diện tối giản, ảnh mẫu trong `docs/template/`), trang `/ui-lab` khi chạy dev, và các mockup đã được người dùng duyệt. Khi spec khác style mặc định của component, làm theo spec. Chunky UI trong `docs/design/` chỉ còn là lưu trữ.
- Màu luôn lấy từ token trong `app/globals.css` (`bg-card`, `bg-secondary`, `bg-surface-2`, `text-muted-foreground`, `text-income`, `bg-expense-soft`…), không viết cứng mã hex.
- Vùng chạm tối thiểu 44px, tôn trọng safe-area (`env(safe-area-inset-*)`), hỗ trợ cả theme sáng lẫn tối.

### Ba lớp component

1. `components/app/`: khối giao diện kiểu app (ví dụ large title, list section, list row, sticky section header, segmented control, chip row, sheet header, FAB). Được tự thiết kế, viết HTML/CSS riêng, không bắt buộc dựa trên shadcn. Mỗi khối có API rõ ràng (props, variant) và tự lo theme tối, safe-area, accessibility.
2. `components/ui/`: primitive của shadcn đã tuỳ biến theo Chunky; ưu tiên cho phần hành vi (dialog, popover, select, focus, a11y).
3. Component của từng tính năng, ghép từ hai lớp trên.

### Tái sử dụng

- Trước khi thêm giao diện, kiểm tra `components/app`, `components/ui`, `components/forms` và component của tính năng. Đã có thì dùng lại; không dựng bản trùng chức năng.
- Cần một khối kiểu app chưa có: thêm vào `components/app` (không viết thẳng trong trang) để các trang khác dùng chung. Cần primitive hành vi chưa có: ưu tiên cài qua shadcn CLI theo `components.json`, không ghi đè component đã tuỳ biến.

### Tuỳ biến style

- Trong `components/app`: tự do thiết kế theo định hướng ở trên.
- Khi một trang cần component trông khác đi, thêm hoặc sửa `variant`/prop trong chính component đó thay vì rải class override ở nơi dùng; sửa một chỗ thì mọi trang đều nhất quán.
- Class ở nơi dùng chỉ để bố cục: kích thước, grid/flex, căn chỉnh, khoảng cách, responsive.
- Đổi một thuộc tính không kéo theo đổi các thuộc tính khác ngoài yêu cầu.

### Quy trình cho thay đổi giao diện

- Với thay đổi lớn (thiết kế lại một trang, thêm khối mới vào `components/app`): làm mockup và chờ người dùng duyệt trước khi code.
- Trước khi báo xong: xem kết quả thật bằng ảnh chụp ở khung điện thoại (390px) và desktop, cả theme sáng lẫn tối.
- Kiểm tra diff để loại bỏ component trùng chức năng và override style không cần thiết.
