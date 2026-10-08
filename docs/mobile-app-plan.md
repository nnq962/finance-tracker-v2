# Lộ trình: giao diện PWA như một app di động thật

Viết 2026-10-08. Finance Tracker vẫn là PWA (chưa có tài khoản Apple Developer nên chưa làm app
native). Chấp nhận không có rung, vuốt lại native và chuyển cảnh như app thật; mục tiêu là **nhìn
vào thấy giống app**, như các bản thiết kế app trên Figma.

## Tiến độ

Làm 2026-10-08, người dùng giao làm hết và tự chọn phương án (không chờ duyệt mockup):

- **Giai đoạn 1:** bỏ qua mockup HTML; ảnh chụp app thật thay cho mockup. Đã chọn: thanh tab có
  nhãn; màu danh mục làm dịu về xám (`tile-tinted`); tiền chi màu chữ thường; Tổng quan: tài sản
  ròng dẫn đầu, nhiệm vụ ngay sau, lời mời Pro cuối trang; nút AI ở Giao dịch lên cạnh tiêu đề.
- **Giai đoạn 2, 3:** xong (`05f0673`). Thêm ngoài plan: thẻ dẫn đầu ở theme tối là xám nổi thay
  cho khối trắng (token `inverse`); segmented control kiểu iOS (viên trắng trên rãnh xám).
- **Giai đoạn 4:** các sheet và màn chi tiết tự theo khuôn nhờ khối dùng chung; sửa thêm avatar
  người liên hệ, số tiền ở sheet tài khoản và chi tiết khoản vay (`247bf46`).
- **Giai đoạn 5:** dòng list xám đi khi chạm, giữ lâu không chọn chữ giao diện, không chớp khi chạm.
- **Giai đoạn 6:** đã xem desktop sáng và tối, không có gì vỡ.

Còn lại: màn giới thiệu lần đầu (cần user mới để xem), trạng thái trống của từng trang.

Vòng 2 (cùng ngày): đầu trang đổi sang kiểu app ngân hàng (phương án C trên canvas "Đầu trang: các
phong cách"): một hàng gọn, tên trang 24 bên trái, công cụ bên phải, cuộn cùng trang. Phần "Khuôn
trang" bên dưới mô tả kiểu cũ (nhãn nhỏ in hoa và tiêu đề lớn); bản đúng nằm trong
`docs/design/README.md`. Danh sách khối chưa giống app: `docs/design/ra-soat-2026-10-08.md`.

## Vì sao bây giờ chưa giống app

Các khối đơn lẻ (dòng list, thẻ, nút) đã đúng cỡ của app. Thứ thiếu là **khuôn trang**: cách xếp
khối thành một màn. So với bản Figma mẫu:

1. **Không có tiêu đề trang.** Giao dịch, Tài khoản, Vay nợ, Cài đặt ẩn tiêu đề trên điện thoại
   (`phoneTitle={false}`), với lý do thanh tab đã gọi tên trang. Nhưng thanh tab giờ chỉ có icon,
   nên không còn gì gọi tên trang. Màn mở đầu bằng một thẻ, trông như trang web cuộn dở.
2. **Nhiều khối nặng ngang nhau.** Tổng quan có banner Pro đen, thẻ Nhiệm vụ, thẻ Tài sản ròng,
   cùng tranh sự chú ý. Banner quảng cáo ở đầu trang chủ là kiểu web.
3. **Đen ở quá nhiều chỗ.** Tab đang chọn, nút nổi, banner, nút trong thẻ đều đen đặc. Figma chỉ
   có một mảng đen mỗi màn.
4. **Quá nhiều màu.** Ô icon mỗi danh mục một màu đậm, icon cũng tô màu, tiền chi và số âm màu đỏ.
   Figma gần như đơn sắc: ô pastel ngả xám, icon màu mực, tiền chi màu chữ thường.
5. **Tiêu đề nhóm lưng chừng.** Chữ xám 14 thường ("Chung", "Cần thu"); Figma dùng hẳn tiêu đề
   đậm 20 hoặc nhãn nhỏ in hoa.
6. **Lỗi bố cục.** "18.000.000đ" ngắt dòng ở thẻ Tiền vào; hai nút nổi đè số tiền ở Giao dịch;
   nút thêm đè "Hiện 1 khoản" ở Vay nợ; trang Tài khoản trống nửa dưới.

## Khuôn trang (đích cần đạt)

Mọi màn tab theo cùng một thứ tự, để học một màn là đoán được các màn khác:

1. **Đầu màn:** nhãn nhỏ in hoa (ngày, tháng, ngữ cảnh), tiêu đề lớn, tối đa một nút tròn bên
   phải. Cuộn xuống thì tiêu đề thu vào thanh nhỏ (đã có `CompactTitleBar`).
2. **Thẻ chính:** một thẻ duy nhất cho con số quan trọng nhất của màn. Chỉ thẻ này được nền đen.
3. **Nhóm nội dung:** tiêu đề nhóm rồi list hoặc biểu đồ. Tiêu đề nhóm có đúng hai kiểu:
   - tiêu đề đậm 20, có ghi chú hoặc "Xem tất cả" bên phải, cho nhóm nội dung chính;
   - nhãn nhỏ in hoa, cho nhóm ngày (giao dịch) và nhóm cài đặt.
4. **Thẻ gợi ý (tuỳ màn):** nền xám, không viền, một icon, một câu, một mũi tên.
5. **Một nút nổi** nếu màn có thao tác chính; list luôn chừa đủ chỗ để dòng cuối không bị che.
6. **Thanh tab có nhãn** dưới icon; tab đang chọn là viên xám nhạt, icon và chữ đậm.

Màu:

- Ô icon nền pastel ngả xám, icon màu mực. Màu danh mục do người dùng chọn vẫn giữ sắc, chỉ dịu
  đi.
- Tiền vào xanh trầm, tiền chi màu chữ thường. Đỏ chỉ cho cảnh báo thật: quá hạn, số dư âm.
- Đen đặc: thẻ chính và nút nổi. Nút khác dùng nền xám hoặc viền.

## Giai đoạn 1: mockup (chưa code)

Theo quy trình của dự án, thay đổi lớn phải có mockup được duyệt trước.

- 5 màn tab, mỗi màn để bản hiện tại cạnh bản theo khuôn mới, sáng và tối, khung 390.
- Những điểm cần bạn chọn trong mockup:
  - Thanh tab có nhãn hay giữ chỉ icon (đề xuất: có nhãn).
  - Cách làm dịu màu danh mục trên ô icon.
  - Tiền chi màu chữ thường hay giữ màu `expense`.
  - Thứ tự nội dung Tổng quan: số dư lên đầu; lời mời Pro và Nhiệm vụ đặt đâu.
  - Nút AI ở Giao dịch: gộp vào sheet thêm giao dịch, hay đưa lên đầu màn.

Xong khi: bạn duyệt mockup.

## Giai đoạn 2: khung chung và khối dùng chung

Đổi ở component thì cả app đổi theo. Mỗi khối mới hoặc biến thể mới đều thêm vào catalog `/design`
và `docs/design/README.md`.

| Việc | Ở đâu |
|---|---|
| Tiêu đề lớn hiện lại trên điện thoại ở mọi trang; thêm nhãn nhỏ in hoa phía trên; bỏ `phoneTitle={false}` và header riêng của Giao dịch | `components/page.tsx` (`PageHeader`), các trang |
| Thanh tab có nhãn, tab đang chọn nền xám nhạt thay cho viên đen | `components/mobile-bottom-nav.tsx` |
| Ô icon kiểu mới: nền dịu, icon màu mực | `components/app/icon-tile.tsx`, `lib/categories/category-colors` |
| Số tiền: tiền chi màu chữ thường; đỏ chỉ khi cảnh báo | `components/app/money.tsx` và nơi dùng `tone="expense"` |
| Hai kiểu tiêu đề nhóm: đậm 20 (`Section`) và nhãn nhỏ in hoa (tiêu đề của `SettingsGroup`, nhóm ngày) | `components/app/section-header.tsx`, `components/settings-list.tsx` |
| Lời mời Pro thành thẻ sáng, không còn đen | `components/app/promo-banner.tsx` |
| Thẻ gợi ý nền xám (khối mới nếu chưa có) | `components/app/` |
| Một nút nổi mỗi màn, chừa đủ chỗ cuối list | `components/app/floating-actions.tsx` |

Xong khi: catalog `/design` hiện đủ khối mới ở cả hai theme, typecheck và lint qua.

## Giai đoạn 3: làm lại 5 màn tab

Mỗi màn làm xong thì chụp điện thoại và desktop, sáng và tối, rồi commit riêng.

- **Tổng quan:** nhãn ngày, "Chào buổi sáng, …", nút chuông. Thẻ chính là số dư hoặc tài sản ròng.
  Rồi dòng tiền, lịch, hạng mục. Lời mời Pro và Nhiệm vụ xuống dưới, gọn lại.
- **Giao dịch:** nhãn là tháng (chạm để đổi), tiêu đề "Giao dịch", nút tìm. Thẻ chính gộp Tiền vào
  và Tiền ra trong một thẻ có vạch chia (hết lỗi ngắt dòng số tiền). Chip Tất cả / Thu / Chi và nút
  lọc. Nhóm ngày bằng nhãn nhỏ in hoa. Một nút nổi.
- **Tài khoản:** nhãn, tiêu đề, nút thêm. Thẻ chính tổng số dư. "Tài khoản của tôi" kèm số tài
  khoản, list, rồi thẻ gợi ý (ví dụ phân bổ tài sản) để màn không trống.
- **Vay nợ:** nhãn, tiêu đề, nút thêm; người liên hệ chuyển lên đầu màn hoặc vào trong. Thẻ chính
  cần trả và cần thu. Cảnh báo quá hạn, rồi các nhóm.
- **Cài đặt:** tiêu đề, thẻ hồ sơ, các nhóm có nhãn nhỏ in hoa.

Xong khi: 5 màn khớp mockup, không còn lỗi ở mục 6 phía trên.

## Giai đoạn 4: màn bên trong

Áp cùng khuôn cho những gì mở ra từ 5 màn tab:

- Sheet thêm, sửa, chi tiết giao dịch; chi tiết tài khoản; chi tiết khoản vay và kỳ trả; người
  liên hệ; hạng mục; thông báo; màn gói.
- Đăng nhập, giới thiệu lần đầu.
- Trạng thái trống, lỗi, và màn tải (skeleton) đúng bố cục mới, gồm cả tiêu đề.

## Giai đoạn 5: cảm giác app (phần PWA làm được, rẻ)

Không bắt buộc, nhưng mỗi việc nhỏ và cộng lại rõ rệt:

- Mọi chỗ bấm được có phản hồi `active:` (mờ hoặc thu nhỏ nhẹ).
- Không chọn được chữ trên thanh tab và nút; không hiện menu khi giữ lâu trên ảnh, icon.
- Màu thanh trạng thái và màn khởi động khớp theme.
- Chuyển tab không chờ: dữ liệu tab đã xem hiện ngay (đã có `staleTimes`), bấm tab là đổi tức thì.

## Giai đoạn 6: desktop

Desktop là bản mở rộng: kiểm tra mọi thay đổi ở khung 1440, sửa tên app bị cắt ở thanh bên.

## Giữ cho không lệch lại

Thêm vào `docs/design/README.md` một danh sách kiểm tra cho mọi màn mới:

- Có tiêu đề lớn trên điện thoại chưa?
- Chỉ một mảng đen (thẻ chính) và tối đa một nút nổi?
- Tiêu đề nhóm thuộc một trong hai kiểu?
- Đỏ chỉ dùng cho cảnh báo?
- Nút nổi có đè nội dung không? Số tiền dài nhất có ngắt dòng không?

## Đã cân nhắc: app native

Viết lại phần điện thoại bằng Expo (React Native) để lên App Store. Chưa làm vì cần tài khoản Apple
Developer. Nếu sau này đi hướng đó, khuôn trang và mockup ở đây vẫn dùng lại được.
