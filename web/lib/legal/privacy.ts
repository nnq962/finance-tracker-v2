import { OPERATOR_NAME, SUPPORT_EMAIL } from "@/lib/site"

import type { LegalDocument } from "./types"

/** Chính sách quyền riêng tư (2026-10-20), written after Nghị định 13/2023/NĐ-CP; the source is also docs/legal/chinh-sach-quyen-rieng-tu.md. */
export const privacyPolicy: LegalDocument = {
  title: "Chính sách quyền riêng tư",
  updated: "2026-10-20",
  intro: "Timi ghi lại tiền của bạn, nên Timi nói rõ dữ liệu nào được giữ, để làm gì, đi qua đâu và bạn làm được gì với nó.",
  sections: [
    {
      title: "Timi là gì và ai chịu trách nhiệm",
      blocks: [
        { kind: "p", text: `Timi (timi.nnqlab.dev) là ứng dụng ghi chép thu chi cá nhân, do ${OPERATOR_NAME}, một cá nhân phát triển tại Việt Nam, vận hành. ${OPERATOR_NAME} là bên kiểm soát và xử lý dữ liệu cá nhân của bạn trong Timi; mọi yêu cầu về dữ liệu gửi tới ${SUPPORT_EMAIL}. Thông tin định danh của người vận hành được cung cấp cho cơ quan có thẩm quyền khi được yêu cầu theo pháp luật.` },
      ],
    },
    {
      title: "Dữ liệu Timi thu thập",
      blocks: [
        { kind: "p", text: "Dữ liệu định danh, nhận từ tài khoản Google khi bạn đăng nhập: tên, địa chỉ email, ảnh đại diện và mã tài khoản Google. Timi không nhận mật khẩu Google của bạn." },
        { kind: "p", text: "Dữ liệu tài chính do bạn nhập: tài khoản và số dư, giao dịch (số tiền, hạng mục, ngày giờ, ghi chú), khoản vay nợ và người liên hệ (tên, biệt danh bạn đặt), hạn mức chi tiêu, hũ tiết kiệm. Theo Nghị định 13/2023, thông tin tài chính thuộc dữ liệu cá nhân nhạy cảm; Timi chỉ xử lý khi bạn chủ động nhập và chỉ để hiển thị lại cho chính bạn." },
        { kind: "p", text: "Câu bạn hỏi trợ lý Timi và bản ghi âm ngắn khi bạn nhập bằng giọng nói. Xem mục 4 về nơi xử lý." },
        { kind: "p", text: "Dữ liệu kỹ thuật: loại thiết bị và trình duyệt, mã thiết bị để gửi thông báo đẩy, nhật ký lỗi (thông báo lỗi, trang đang mở, phiên bản app), thời gian tải trang. Timi dùng Cloudflare Web Analytics để đếm lượt truy cập, không đặt cookie theo dõi." },
        { kind: "p", text: "Dữ liệu thanh toán khi bạn mua gói Pro: mã đơn, số tiền, thời điểm, trạng thái. Timi không nhận và không lưu số thẻ hay thông tin tài khoản ngân hàng của bạn; phần đó do PayOS xử lý." },
        { kind: "p", text: "Góp ý bạn gửi trong app: loại, nội dung, và phiên bản cùng thiết bị nếu bạn để bật." },
        { kind: "p", text: "Timi không thu thập vị trí, danh bạ, ảnh hay dữ liệu từ ứng dụng khác trên máy bạn." },
      ],
    },
    {
      title: "Timi dùng dữ liệu để làm gì",
      blocks: [
        { kind: "list", items: [
          "Hiển thị lại cho bạn: số dư, thu chi, vay nợ, hạn mức, biểu đồ.",
          "Trả lời câu hỏi của bạn với trợ lý Timi và nhập giao dịch bằng giọng nói.",
          "Gửi thông báo bạn đã bật: nhắc ghi chi tiêu, cảnh báo hạn mức, tin từ Timi.",
          "Cung cấp gói Pro bạn đã mua và xác nhận thanh toán.",
          "Sửa lỗi và giữ app chạy ổn định.",
          "Trả lời khi bạn góp ý hoặc cần hỗ trợ.",
        ] },
        { kind: "p", text: "Timi không bán dữ liệu, không dùng dữ liệu tài chính của bạn cho quảng cáo, không chấm điểm tín dụng và không chia sẻ cho bên thứ ba ngoài những bên nêu ở mục 4." },
        { kind: "p", text: "Cơ sở xử lý: sự đồng ý của bạn khi đăng nhập và nhập dữ liệu (Điều 11 Nghị định 13/2023), và việc thực hiện dịch vụ bạn đã chọn dùng. Bạn rút lại sự đồng ý bằng cách xoá dữ liệu hoặc xoá tài khoản (mục 7)." },
      ],
    },
    {
      title: "Dữ liệu đi qua những bên nào",
      blocks: [
        { kind: "p", text: "Timi chạy trên máy chủ đặt tại Việt Nam. Để hoạt động, Timi dùng các dịch vụ sau, mỗi dịch vụ chỉ nhận phần dữ liệu cần cho việc của nó:" },
        { kind: "table", columns: ["Dịch vụ", "Nhận gì", "Để làm gì"], rows: [
          ["Google Firebase Authentication", "Tài khoản Google của bạn", "Đăng nhập"],
          ["Google Firebase Cloud Messaging", "Mã thiết bị, nội dung thông báo", "Gửi thông báo đẩy"],
          ["Google Gemini (API, gói trả phí)", "Câu bạn hỏi trợ lý cùng tên tài khoản, hạng mục, người liên hệ. Số tiền được tính trên máy chủ của Timi, không gửi đi", "Hiểu câu hỏi và câu ghi chép. Google không dùng nội dung này để huấn luyện; log giám sát lạm dụng giữ 55 ngày. Khi Gemini không trả lời được, mô hình chạy trên máy chủ của Timi thay thế"],
          ["Nhận dạng giọng nói trên máy chủ Timi", "Bản ghi âm ngắn", "Chuyển giọng nói thành chữ; bản ghi không được lưu sau khi nhận dạng"],
          ["PayOS", "Mã đơn, số tiền, email", "Thanh toán gói Pro"],
          ["Cloudflare", "Lưu lượng truy cập (mã hoá), số lượt truy cập", "Đưa Timi tới trình duyệt của bạn, chống tấn công, thống kê ẩn danh"],
          ["Sentry", "Nhật ký lỗi: thông báo lỗi, trang, phiên bản, loại thiết bị", "Sửa lỗi"],
          ["Telegram", "Nội dung góp ý bạn gửi, email của bạn", "Báo góp ý tới người vận hành"],
        ] },
        { kind: "p", text: "Google, Sentry, Cloudflare và Telegram có máy chủ ngoài Việt Nam; việc chuyển dữ liệu ra nước ngoài giới hạn ở phần nêu trên và theo chính sách của từng dịch vụ." },
      ],
    },
    {
      title: "Lưu bao lâu",
      blocks: [
        { kind: "list", items: [
          "Dữ liệu tài chính và tài khoản: cho tới khi bạn xoá (xoá dữ liệu hoặc xoá tài khoản).",
          "Bản sao lưu máy chủ: tối đa 30 ngày, sau đó tự xoá; dữ liệu đã xoá biến mất khỏi bản sao lưu trong thời gian này.",
          "Nhật ký lỗi: 90 ngày.",
          "Hồ sơ thanh toán: PayOS giữ theo quy định của họ; bản ghi của Timi xoá cùng tài khoản.",
          "Câu hỏi với trợ lý: Timi lưu số lượt dùng, không lưu nội dung câu hỏi sau khi trả lời.",
        ] },
      ],
    },
    {
      title: "Bảo mật",
      blocks: [
        { kind: "p", text: "Dữ liệu đi qua kết nối HTTPS. Phiên đăng nhập lưu trong cookie HTTP-only mà mã trên trang không đọc được. Mọi thao tác đọc ghi đều được máy chủ xác minh phiên và chỉ chạm tới dữ liệu của chính bạn. Máy chủ được sao lưu định kỳ và chỉ người vận hành truy cập được." },
        { kind: "p", text: "Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố ảnh hưởng tới dữ liệu của bạn, Timi thông báo cho bạn qua email và cho cơ quan có thẩm quyền theo quy định." },
      ],
    },
    {
      title: "Quyền của bạn",
      blocks: [
        { kind: "p", text: "Theo Nghị định 13/2023, bạn có quyền biết, truy cập, chỉnh sửa, xoá, hạn chế xử lý, phản đối, rút lại sự đồng ý và khiếu nại. Trong Timi bạn tự làm được:" },
        { kind: "list", items: [
          "Xem và sửa: mọi dữ liệu hiện trong app, sửa trực tiếp.",
          "Xuất dữ liệu: Cài đặt › Dữ liệu › Xuất dữ liệu, nhận file Excel hoặc CSV.",
          "Xoá dữ liệu: Cài đặt › Dữ liệu › Xoá toàn bộ dữ liệu (giữ đăng nhập).",
          "Xoá tài khoản: Cài đặt › Dữ liệu › Xoá tài khoản, xoá cả đăng nhập, dữ liệu và thiết bị nhận thông báo; có hiệu lực ngay, không khôi phục được.",
          "Tắt thông báo: Cài đặt › Thông báo.",
        ] },
        { kind: "p", text: `Yêu cầu khác gửi về ${SUPPORT_EMAIL}; Timi trả lời trong vòng 72 giờ.` },
      ],
    },
    {
      title: "Trẻ em",
      blocks: [{ kind: "p", text: "Timi dành cho người từ 18 tuổi. Nếu bạn biết một người dưới 18 tuổi đã dùng Timi mà không có sự đồng ý của người giám hộ, hãy báo cho Timi để xoá." }],
    },
    {
      title: "Thay đổi chính sách",
      blocks: [{ kind: "p", text: "Khi chính sách thay đổi đáng kể, Timi thông báo trong app (Tin từ Timi) trước khi áp dụng. Ngày cập nhật ghi ở đầu trang." }],
    },
    {
      title: "Liên hệ",
      blocks: [{ kind: "p", text: `${OPERATOR_NAME}, Việt Nam. Email: ${SUPPORT_EMAIL}.` }],
    },
  ],
}
