<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Quy tắc giao diện

### Định hướng: một app native chạy trên web

- Finance Tracker là PWA dùng chủ yếu trên điện thoại. Mục tiêu là người dùng cảm thấy đang dùng một app iOS/Android thật, không phải một trang web. Thiết kế cho điện thoại trước (khung 390px); desktop là bản mở rộng, không phải bản gốc.
- Hình dung theo ngôn ngữ của app native: tiêu đề lớn thu gọn khi cuộn, list chia nhóm với tiêu đề nhóm bám khi cuộn, dòng list cao và dễ chạm, segmented control và chip thay cho form lọc, bottom sheet thay cho dialog, thanh tab dưới, nút chính trong tầm ngón cái, chuyển cảnh và cử chỉ (vuốt, kéo sheet), phản hồi khi chạm (`active:`) thay cho hover. Tránh bố cục kiểu trang web: card lồng card, khung viền bao mọi thứ, bảng dày đặc, hover làm tín hiệu chính.
- Chưa có design system cố định. Nguồn chuẩn là các mockup người dùng đã duyệt (lưu trong `docs/design/`). Khi một hướng thiết kế được duyệt, ghi lại token, kiểu chữ và quy ước của nó vào `docs/design/` để các trang sau dùng chung.

### Không bị bó bởi shadcn

- shadcn/ui (preset `b27GcrRo`, style `radix-rhea`, xem `components.json`) chỉ là điểm khởi đầu, không phải khuôn. Giá trị chính của nó là phần hành vi: focus, bàn phím, ARIA, portal, định vị popover (Radix/Base UI bên dưới).
- Khi giao diện kiểu app cần thứ mà shadcn không có, hoặc component shadcn trông giống web, cứ tự thiết kế: viết HTML/CSS/Tailwind riêng, dùng `motion` cho chuyển động và cử chỉ, `vaul` cho sheet kéo được, Radix/Base UI trực tiếp cho hành vi. Không cần ép một khối native vào component shadcn có sẵn.
- `components/ui/` là code của dự án, được sửa tự do (đổi style, thêm variant, thêm prop). Đừng chạy lại `shadcn add --overwrite` hay `init --reinstall` lên component đã sửa nếu không chủ ý thay toàn bộ.

### Ba lớp component

1. `components/app/`: khối giao diện kiểu app (large title, list section, list row, sticky section header, segmented control, chip row, sheet, tab bar, FAB…). Tự thiết kế, không bắt buộc dựa trên shadcn. Mỗi khối có API rõ ràng (props, variant) và tự lo theme tối, safe-area, accessibility.
2. `components/ui/`: primitive từ shadcn, dùng khi cần hành vi chuẩn (dialog, popover, select, dropdown, tooltip, form field).
3. Component của từng tính năng (`app/(main)/<trang>/_components`, `components/<tính năng>`), ghép từ hai lớp trên; chỉ chứa bố cục và dữ liệu, không tự định nghĩa style dùng chung.

### Màu và token

- Màu luôn lấy từ token trong `app/globals.css`, không viết cứng hex/oklch trong component. Token trung tính của shadcn (`background`, `card`, `muted`, `primary`, `border`…) cộng token ý nghĩa: `income` (tiền vào), `expense` (tiền ra), `transfer` (chuyển khoản), `ai` (AI và gói Pro), `warning`. Nền nhạt dùng độ mờ: `bg-income/10`, `bg-ai/15`.
- Thiếu token thì thêm vào `globals.css`, đủ cả theme sáng lẫn tối, thay vì viết cứng một chỗ.
- Ngoại lệ: dữ liệu màu do người dùng chọn (màu danh mục, màu tài khoản) và ảnh OG/ảnh chia sẻ (không đọc được CSS variable).

### Tái sử dụng và tuỳ biến

- Trước khi thêm giao diện, kiểm tra `components/app`, `components/ui`, `components/forms` và component của tính năng. Đã có thì dùng lại; không dựng bản trùng chức năng.
- Khối kiểu app dùng ở nhiều trang thì đặt trong `components/app`, không viết thẳng trong trang.
- Khi một chỗ cần component trông khác đi, thêm hoặc sửa `variant`/prop trong chính component đó thay vì rải class override ở nơi dùng. Class ở nơi dùng chỉ để bố cục: kích thước, grid/flex, căn chỉnh, khoảng cách, responsive.
- Đổi một thuộc tính không kéo theo đổi các thuộc tính khác ngoài yêu cầu.

### Chất lượng kiểu app

- Vùng chạm tối thiểu 44px; tôn trọng safe-area (`env(safe-area-inset-*)`); hỗ trợ cả theme sáng lẫn tối.
- Chuyển động ngắn, có ý nghĩa, tôn trọng `prefers-reduced-motion`.
- Chữ tiếng Việt dùng Be Vietnam Pro (`font-sans`); số tiền dùng `tabular-nums`.

### Quy trình cho thay đổi giao diện

- Thay đổi lớn (thiết kế lại một trang, thêm khối mới vào `components/app`, đổi token): làm mockup và chờ người dùng duyệt trước khi code.
- Trước khi báo xong: chụp ảnh thật bằng `node scripts/screenshot.mjs <đường dẫn> --device=phone|desktop --theme=light|dark` (cần `npm run dev` và `DEV_LOGIN=1`), xem ở khung điện thoại và desktop, cả sáng lẫn tối.
- Kiểm tra diff để loại bỏ component trùng chức năng và override style không cần thiết.
