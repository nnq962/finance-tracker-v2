# Chính sách quyền riêng tư

Dự thảo 2026-10-20 cho trang `/privacy`. Nguồn hiển thị là `web/lib/legal/*.ts`; sửa ở đó rồi cập nhật file này. Văn bản
viết theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân; chưa qua luật sư, nên khi mở cho
người lạ dùng hoặc bán Pro rộng nên nhờ một người có chuyên môn rà lại.

Cập nhật lần cuối: 20/10/2026.

## 1. Timi là gì và ai chịu trách nhiệm

Timi (timi.nnqlab.dev) là ứng dụng ghi chép thu chi cá nhân. Bên kiểm soát và xử lý dữ liệu là
nnqlab (một cá nhân phát triển tại Việt Nam), địa chỉ Việt Nam, email hotro@timi.nnqlab.dev. Mọi yêu cầu về dữ liệu
cá nhân gửi về email này.

## 2. Dữ liệu Timi thu thập

**Dữ liệu định danh**, nhận từ tài khoản Google khi bạn đăng nhập: tên, địa chỉ email, ảnh đại
diện và mã tài khoản Google. Timi không nhận mật khẩu Google của bạn.

**Dữ liệu tài chính do bạn nhập**: tài khoản và số dư, giao dịch (số tiền, hạng mục, ngày giờ, ghi
chú), khoản vay nợ và người liên hệ (tên, biệt danh bạn đặt), hạn mức chi tiêu, hũ tiết kiệm.
Theo Nghị định 13/2023, thông tin tài chính thuộc **dữ liệu cá nhân nhạy cảm**; Timi chỉ xử lý
khi bạn chủ động nhập và chỉ để hiển thị lại cho chính bạn.

**Câu bạn hỏi trợ lý Timi và nội dung bạn đọc bằng giọng nói**: câu hỏi, câu trả lời, và bản ghi
âm ngắn khi bạn dùng tính năng nhập bằng giọng nói. Xem mục 4 về nơi xử lý.

**Dữ liệu kỹ thuật**: loại thiết bị và trình duyệt, mã thiết bị để gửi thông báo đẩy, nhật ký
lỗi (thông báo lỗi, trang đang mở, phiên bản app), thời gian tải trang. Timi dùng Cloudflare Web
Analytics để đếm lượt truy cập mà không đặt cookie theo dõi.

**Dữ liệu thanh toán** khi bạn mua gói Pro: mã đơn, số tiền, thời điểm, trạng thái. Timi **không
nhận và không lưu** số thẻ hay thông tin tài khoản ngân hàng của bạn; phần đó do PayOS xử lý.

Timi không thu thập vị trí, danh bạ, ảnh hay dữ liệu từ ứng dụng khác trên máy bạn.

## 3. Timi dùng dữ liệu để làm gì

- Hiển thị lại cho bạn: số dư, thu chi, vay nợ, hạn mức, biểu đồ.
- Trả lời câu hỏi của bạn với trợ lý Timi và nhập giao dịch bằng giọng nói.
- Gửi thông báo bạn đã bật: nhắc ghi chi tiêu, cảnh báo hạn mức, tin từ Timi.
- Cung cấp gói Pro bạn đã mua và xác nhận thanh toán.
- Sửa lỗi và giữ app chạy ổn định (nhật ký lỗi, thời gian tải).
- Liên hệ với bạn khi bạn góp ý hoặc cần hỗ trợ.

Timi không bán dữ liệu, không dùng dữ liệu tài chính của bạn cho quảng cáo, không chấm điểm tín
dụng và không chia sẻ cho bên thứ ba ngoài những bên nêu ở mục 4.

Cơ sở xử lý: sự đồng ý của bạn khi đăng nhập và nhập dữ liệu (Điều 11 Nghị định 13), và việc
thực hiện dịch vụ bạn đã chọn dùng. Bạn rút lại sự đồng ý bằng cách xoá dữ liệu hoặc xoá tài
khoản (mục 7).

## 4. Dữ liệu đi qua những bên nào

Timi chạy trên máy chủ do nnqlab vận hành, đặt tại Việt Nam. Để hoạt động, Timi dùng các dịch vụ
sau, mỗi dịch vụ chỉ nhận phần dữ liệu cần cho việc của nó:

| Dịch vụ | Nhận gì | Để làm gì |
|---|---|---|
| Google Firebase Authentication | Tài khoản Google của bạn | Đăng nhập |
| Google Firebase Cloud Messaging | Mã thiết bị, nội dung thông báo | Gửi thông báo đẩy |
| Google Gemini (API) | Câu bạn hỏi trợ lý, kèm phần dữ liệu tài chính cần để trả lời (ví dụ tổng chi tháng này) | Trả lời trợ lý Timi. Khi Gemini không trả lời được, câu hỏi được xử lý bằng mô hình chạy trên máy chủ của Timi, không ra ngoài |
| Nhận dạng giọng nói trên máy chủ Timi | Bản ghi âm ngắn | Chuyển giọng nói thành chữ; bản ghi không được lưu sau khi nhận dạng |
| PayOS | Mã đơn, số tiền, email | Thanh toán gói Pro |
| Cloudflare | Lưu lượng truy cập (được mã hoá), số lượt truy cập | Đưa Timi tới trình duyệt của bạn, chống tấn công, thống kê ẩn danh |
| Sentry | Nhật ký lỗi: thông báo lỗi, trang, phiên bản, loại thiết bị | Sửa lỗi |

Google, Sentry và Cloudflare có máy chủ ngoài Việt Nam; việc chuyển dữ liệu ra nước ngoài giới
hạn ở phần nêu trên và theo chính sách của từng dịch vụ.

## 5. Lưu bao lâu

- Dữ liệu tài chính và tài khoản: cho tới khi bạn xoá (xoá dữ liệu hoặc xoá tài khoản).
- Bản sao lưu máy chủ: tối đa 30 ngày, sau đó tự xoá; dữ liệu đã xoá sẽ biến mất khỏi bản sao
  lưu trong thời gian này.
- Nhật ký lỗi: 90 ngày.
- Lịch sử thanh toán: [5 năm] theo quy định kế toán, kể cả khi bạn đã xoá tài khoản.
- Câu hỏi với trợ lý: Timi lưu số lượt dùng, không lưu nội dung câu hỏi sau khi trả lời.

## 6. Bảo mật

Dữ liệu đi qua kết nối HTTPS. Phiên đăng nhập lưu trong cookie HTTP-only mà mã trên trang không
đọc được. Mọi thao tác đọc ghi đều được máy chủ xác minh phiên và chỉ chạm tới dữ liệu của chính
bạn. Máy chủ được sao lưu định kỳ và chỉ người vận hành truy cập được. Không hệ thống nào an toàn
tuyệt đối; nếu xảy ra sự cố ảnh hưởng tới dữ liệu của bạn, Timi sẽ thông báo cho bạn qua email và
cho cơ quan có thẩm quyền theo quy định.

## 7. Quyền của bạn

Theo Nghị định 13/2023, bạn có quyền biết, truy cập, chỉnh sửa, xoá, hạn chế xử lý, phản đối, rút
lại sự đồng ý và khiếu nại. Trong Timi bạn tự làm được:

- **Xem và sửa**: mọi dữ liệu hiện trong app, sửa trực tiếp.
- **Xuất dữ liệu**: Cài đặt › Dữ liệu › Xuất dữ liệu, nhận file Excel hoặc CSV.
- **Xoá dữ liệu**: Cài đặt › Dữ liệu › Xoá toàn bộ dữ liệu (giữ đăng nhập).
- **Xoá tài khoản**: Cài đặt › Dữ liệu › Xoá tài khoản, xoá cả đăng nhập, dữ liệu và thiết bị
  nhận thông báo; có hiệu lực ngay, không khôi phục được.
- **Tắt thông báo**: Cài đặt › Thông báo.

Yêu cầu khác gửi về hotro@timi.nnqlab.dev; Timi trả lời trong vòng 72 giờ.

## 8. Trẻ em

Timi dành cho người từ 18 tuổi. Nếu bạn biết một người dưới 18 tuổi đã dùng Timi mà không có sự
đồng ý của người giám hộ, hãy báo cho Timi để xoá.

## 9. Thay đổi chính sách

Khi chính sách thay đổi đáng kể, Timi thông báo trong app (Tin từ Timi) trước khi áp dụng. Ngày
cập nhật ghi ở đầu trang.

## 10. Liên hệ

nnqlab, Việt Nam, hotro@timi.nnqlab.dev.
