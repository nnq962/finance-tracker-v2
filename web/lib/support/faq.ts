import { SUPPORT_EMAIL } from "@/lib/site"

export type FaqItem = { q: string; a: string }
export type FaqGroup = { title: string; items: FaqItem[] }

/** The questions people ask, in app (Cài đặt › Hỗ trợ) and on /faq. Plain text; keep each answer to a few sentences. */
export const faq: FaqGroup[] = [
  {
    title: "Bắt đầu",
    items: [
      {
        q: "Timi có kết nối với ngân hàng không?",
        a: "Không. Timi là sổ ghi chép: bạn tự nhập, hoặc đọc một câu cho trợ lý điền giúp. Timi không đọc tài khoản ngân hàng, tin nhắn hay app khác trên máy bạn, nên bạn không phải giao mật khẩu ngân hàng cho ai.",
      },
      {
        q: "Dùng trên điện thoại thế nào?",
        a: "Mở timi.nnqlab.dev bằng Safari (iPhone) hoặc Chrome (Android), chọn Chia sẻ › Thêm vào Màn hình chính. Timi mở như một app, chạy toàn màn hình và nhận thông báo. Trong Cài đặt › Ứng dụng có hướng dẫn từng bước.",
      },
      {
        q: "Ghi bằng giọng nói ra sao?",
        a: "Chạm Timi ở thanh dưới, giữ nút micro và nói, ví dụ \"ăn trưa 45k tiền mặt\". Timi hiện thẻ xem trước để bạn sửa rồi mới lưu. Nói được nhiều khoản trong một câu.",
      },
      {
        q: "Tôi có thể dùng chung với vợ/chồng không?",
        a: "Hiện mỗi tài khoản Google là một sổ riêng, chưa có sổ chung. Nếu cần, hai người có thể dùng chung một tài khoản Google đăng nhập Timi trên hai máy.",
      },
    ],
  },
  {
    title: "Gói Pro",
    items: [
      {
        q: "Pro khác Free ở đâu?",
        a: "Free đủ mọi tính năng ghi chép, với 15 lượt trợ lý AI mỗi tháng. Pro có 300 lượt AI mỗi tháng và các quyền lợi ghi trên màn gói. Làm nhiệm vụ trong app cũng được cộng lượt AI.",
      },
      {
        q: "Thanh toán bằng gì, có tự gia hạn không?",
        a: "Thanh toán qua PayOS bằng chuyển khoản hoặc quét QR. Pro không tự gia hạn: hết hạn thì về Free, dữ liệu vẫn nguyên.",
      },
      {
        q: "Hoàn tiền thế nào?",
        a: `Trong 7 ngày kể từ khi mua, nếu chưa dùng quá 10 lượt AI của gói, bạn được hoàn toàn bộ. Gửi email tới ${SUPPORT_EMAIL} kèm mã đơn. Chi tiết trong Điều khoản sử dụng.`,
      },
    ],
  },
  {
    title: "Dữ liệu",
    items: [
      {
        q: "Dữ liệu của tôi lưu ở đâu, ai xem được?",
        a: "Trên máy chủ của Timi đặt tại Việt Nam, sau đăng nhập Google. Mỗi thao tác chỉ chạm tới dữ liệu của chính bạn. Chi tiết trong Chính sách quyền riêng tư.",
      },
      {
        q: "Câu tôi hỏi trợ lý có gửi ra ngoài không?",
        a: "Có một phần: câu hỏi cùng tên tài khoản, hạng mục, người liên hệ được gửi tới Google Gemini để hiểu ý; số tiền được tính trên máy chủ của Timi. Google ở gói trả phí không dùng nội dung này để huấn luyện.",
      },
      {
        q: "Xoá tài khoản thì mất gì?",
        a: "Mất toàn bộ dữ liệu và đăng nhập Google khỏi Timi, phần Pro còn lại không hoàn, không khôi phục được. Hãy xuất dữ liệu ra Excel trước, trong Cài đặt › Dữ liệu.",
      },
      {
        q: "Tôi xuất dữ liệu ra được không?",
        a: "Được: Cài đặt › Dữ liệu › Xuất dữ liệu, chọn Excel hoặc CSV, file tải thẳng về máy bạn.",
      },
    ],
  },
]
