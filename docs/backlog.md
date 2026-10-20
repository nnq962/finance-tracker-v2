# Việc còn lại

Danh sách những việc đã bàn nhưng chưa làm, gom ngày 2026-10-17. Làm xong mục nào thì xoá mục đó
(hoặc ghi phiên bản đã làm) để file luôn là danh sách việc thật sự còn lại.

## 1. Cho Timi giống một sản phẩm chuyên nghiệp

Bàn ngày 2026-10-14; người dùng chọn làm tính năng trước, hoàn thiện phần này sau. Khi mở app cho
người lạ dùng hoặc bán Pro rộng hơn thì nên làm sớm ít nhất mục 1, 3 và 8.

1. ~~Chính sách quyền riêng tư và Điều khoản sử dụng~~ (6.30.0: `/privacy`, `/terms` từ `web/lib/legal/*.ts`,
   bản nháp `docs/legal/*.md`; chưa qua luật sư; người vận hành ghi là nnqlab + email, không tên cá nhân).
   Còn lại: thông báo website với Bộ Công Thương khi bán Pro rộng.
2. ~~Xoá tài khoản và xuất dữ liệu~~ (6.8.0 xoá dữ liệu; 6.28.0 xuất Excel/CSV và xoá hẳn tài khoản,
   `lib/user-data/export.ts`, `deleteAccountAction`).
3. ~~Liên hệ, hỗ trợ~~ (6.29.0: FAQ trong app và `/faq`, Góp ý lưu bảng `feedback` + báo Telegram, email `SUPPORT_EMAIL` trong `lib/site.ts`; người dùng tạo địa chỉ trên Cloudflare Email Routing).
4. ~~Trang 404 và trang lỗi~~ (6.16.1, `StatusScreen`, `ErrorCard`).
5. ~~Header bảo mật~~ (6.16.0: HSTS, chống nhúng, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
   Còn lại: CSP giới hạn script (cần nonce cho mọi script).
6. **Trang giới thiệu:** bảng giá Free/Pro, câu hỏi thường gặp, trang công khai "Có gì mới" lấy từ
   `web/lib/releases.ts`.
7. **Email cho gói Pro:** hoá đơn khi mua, nhắc trước khi hết hạn.
8. **Theo dõi lỗi:** Sentry đã cài (6.16.0) nhưng tắt; người dùng tạo project trên sentry.io rồi điền
   `NEXT_PUBLIC_SENTRY_DSN` vào `deploy/.env` và deploy lại. Sau này có thể thêm tải source map lên Sentry.
9. **Theo dõi app còn sống:** đường dẫn `/api/health` đã có (6.16.0); người dùng tạo monitor trên UptimeRobot.
10. ~~Thống kê truy cập~~: dùng Cloudflare Web Analytics có sẵn (2026-10-18).

## 2. Phần còn dở của lộ trình "giống app" (`docs/mobile-app-plan.md`)

- Màn giới thiệu lần đầu (cần một người dùng mới để xem và chỉnh).
- Màn trống của từng trang khi chưa có dữ liệu.
- Các khối chưa giống app còn lại trong `docs/design/ra-soat-2026-10-08.md` (rà lại xem mục nào đã
  xong).

## 3. Hạn mức chi tiêu: phần để sau

Đã làm: hạn mức tổng và theo nhóm, chi tiết nhóm và tổng, xem lại tháng trước, gợi ý khi chưa có
hạn mức, cảnh báo vượt trong form, gợi ý chỉnh hạn mức, cài đặt thông báo, ràng buộc nhóm với tổng.

- **Nhận xét tự động:** "Tuần này chi Ăn uống nhiều hơn tuần trước 30%", "Khoản lớn nhất…".
- **"Hỏi Timi về nhóm này":** mở trợ lý với câu hỏi đã điền sẵn.
- **Dồn phần chưa chi sang tháng sau** (rollover).
- **Tóm tắt hạn mức mỗi tuần** qua thông báo.
- Vay nợ và tiền gốc trả nợ không tính vào hạn mức; lãi đi vay và phí chuyển khoản tính vào hạn mức tổng (2026-10-17).
- Trợ lý Timi chưa biết về hạn mức chi tiêu.

## 4. Hũ tiết kiệm

- ~~Hạng mục mặc định khi "Đã mua"~~ (6.17.3: đoán theo biểu tượng và tên hũ, không chắc thì để trống,
  `lib/savings/bought-category.ts`).
- ~~Gợi ý biểu tượng theo tên~~ (6.17.3: bảng từ khoá `lib/icons/icon-keywords.ts`, cho cả hạng mục).

## 5. Giao diện

- ~~Nút Xoá đỏ ở theme tối~~ (6.17.4: token `destructive-fill` `#cf4040`, tương phản 4,69).
- **Góc liên tục (squircle) cho thẻ, như Apple** (bàn 2026-10-20, để sau vì phức tạp): Safari chưa có
  `corner-shape`, còn cắt bằng `clip-path` (như `lib/smooth-capsule.ts` của tab bar) thì mất bóng thẻ,
  nên `Card` cần lớp ngoài mang bóng và lớp trong bị cắt; thử tốc độ cuộn trên iPhone. Trước đó lấy
  bán kính và Corner smoothing của "List / Inset Grouped" trong kit iOS 26 trên Figma.

## 6. Kỹ thuật

- ~~Test thanh toán lỗi sẵn~~ (6.17.3: `noticeSale` chạy ở nền khi không có request).

## 6b. Tốc độ

Từ ba báo cáo `docs/reports/toc-do-*-2026-10-17.md` và bảng ghi tốc độ trên máy (Cài đặt › Quản trị ›
"Ghi tốc độ", hoặc `?debug=1`; giữ lại làm công cụ đo). Đã làm (6.15.18–6.15.25): tunnel HTTP/2, nhớ kiểm tra
thu hồi phiên 60 giây và layout không chờ, gọn tạo phiên, tải lười biểu đồ, sheet, trợ lý và ghi chú phát
hành, Firebase popup chỉ ở `/login`, logo ngân hàng nhẹ, log `[slow]`, Cài đặt của admin tải dữ liệu quản trị
khi mở, mở lại app sau deploy thì tải bản mới ngay, huỷ đăng nhập Google sau 3 giây, việc nền lúc mở app đi qua
API thay vì Server Action (không chặn chuyển trang), thanh bên desktop tải trước khung chờ. Trên Cloudflare
(người dùng làm): Cache Rule cho `/__/auth/*`, tắt HTTP/3.

- **iPhone đứng 3–11 giây khi tắt hẳn rồi mở lại app nhiều lần** (wifi nhà; desktop cùng wifi không bị;
  `/cdn-cgi/rum` cũng đứng nên là đường tới Cloudflare). Còn thử bằng 4G để biết do mạng nhà hay do iOS.
  Nếu do mạng nhà: khởi động lại router, xem QoS/chống DoS; hoặc đặt một VPS ở Việt Nam làm cổng vào.
- **Lỗi React #418** (lệch nội dung server và trình duyệt) thấy một lần trong Console của Chrome trên Mac;
  dev không tái hiện được. Thử lại trong cửa sổ ẩn danh để loại trừ extension.
- **Firebase auth phía trình duyệt nạp sau hydrate** ở các tab chính (`AuthSessionGuard`).
- **motion và bộ icon hạng mục** (lucide ~100 KB): xem lại sau khi đo trên iPhone.
- **Gọn `getBudgetOverview`** (~17 truy vấn, đọc lại nợ nhiều lần) và bỏ `getLinkedAccountIds` khỏi
  `getAccounts`; chỉ đáng làm khi dữ liệu lớn.
- **Phiên tự quản trong Postgres** (vẫn đăng nhập bằng Google): bỏ hẳn vòng hỏi Google mỗi request, thu hồi
  có hiệu lực ngay. Việc lớn, chỉ khi cần.

## 7. Cần thử trên iPhone thật

Những thứ chỉ kiểm được bằng trình duyệt giả lập, chưa thử trên máy thật:

- Vuốt để đóng sheet.
- Vùng an toàn: nút ở chân sheet không bị thanh home che, bàn phím không che ô đang nhập.
- Thông báo đẩy của hạn mức (80%/90%/vượt) và "Tin từ Timi" của admin.
- Header sheet không còn nháy khi quay lại màn trước (6.15.5).
- Sheet chọn tháng và các sheet đáy trên máy tính (6.9.1) và trên iPad nếu có.
- Đăng nhập Google ở Safari và ở PWA: popup mở ngay, không báo bị chặn; đóng cửa sổ chọn tài khoản thì
  khoảng 3 giây sau báo huỷ (6.15.19, 6.15.21).
- Lần đầu mở mỗi sheet (form giao dịch, khoản nợ, tài khoản, màn gói, trợ lý) không trắng và cú chạm đầu
  trong sheet không bị nuốt (6.15.19).
- Mở lại app sau một lần deploy: màn "Đang khởi động" rồi vào bản mới, không đen màn khi chạm tab (6.15.21).

## 8. Đang chờ người dùng quyết

- Không còn việc nào (Cài đặt sửa ở 6.15.6, có chặn trùng tên hạng mục; Tổng quan sửa ở 6.15.8).
