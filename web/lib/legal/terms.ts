import { OPERATOR_NAME, SUPPORT_EMAIL } from "@/lib/site"

import type { LegalDocument } from "./types"

/** Điều khoản sử dụng (2026-10-20); the source is also docs/legal/dieu-khoan-su-dung.md. */
export const termsOfUse: LegalDocument = {
  title: "Điều khoản sử dụng",
  updated: "2026-10-20",
  intro: "Những gì bạn và Timi cam kết với nhau khi bạn dùng app. Viết ngắn và thẳng; có gì chưa rõ, hỏi Timi.",
  sections: [
    {
      title: "Chấp nhận điều khoản",
      blocks: [{ kind: "p", text: `Khi đăng nhập và dùng Timi (timi.nnqlab.dev), bạn đồng ý với Điều khoản này và Chính sách quyền riêng tư. Nếu không đồng ý, vui lòng không dùng Timi. Timi do ${OPERATOR_NAME} vận hành.` }],
    },
    {
      title: "Timi làm gì",
      blocks: [{ kind: "p", text: "Timi là công cụ ghi chép và theo dõi tài chính cá nhân: tài khoản, thu chi, vay nợ, hạn mức, hũ tiết kiệm, kèm trợ lý AI trả lời câu hỏi về dữ liệu của bạn. Timi không phải ngân hàng, ví điện tử hay tổ chức tài chính; Timi không giữ tiền, không chuyển tiền và không kết nối tới tài khoản ngân hàng của bạn. Mọi con số trong Timi là do bạn nhập." }],
    },
    {
      title: "Tài khoản",
      blocks: [{ kind: "list", items: [
        "Bạn đăng nhập bằng tài khoản Google của mình và chịu trách nhiệm giữ an toàn cho tài khoản đó.",
        "Mỗi người một tài khoản; không dùng tài khoản của người khác.",
        "Bạn phải từ 18 tuổi trở lên.",
        "Bạn có thể xoá tài khoản bất cứ lúc nào trong Cài đặt; việc xoá có hiệu lực ngay và không khôi phục được.",
      ] }],
    },
    {
      title: "Gói Free và gói Pro",
      blocks: [{ kind: "list", items: [
        "Gói Free dùng miễn phí với số lượt trợ lý AI giới hạn mỗi tháng.",
        "Gói Pro mở thêm lượt AI và các quyền lợi ghi trên trang gói. Giá và thời hạn hiện trên màn mua tại thời điểm mua; thanh toán qua PayOS bằng chuyển khoản hoặc QR. Gói Pro không tự gia hạn: hết hạn thì về Free, dữ liệu vẫn giữ nguyên.",
        `Hoàn tiền: trong vòng 7 ngày kể từ khi mua, nếu bạn chưa dùng quá 10 lượt AI của gói, bạn được hoàn toàn bộ số tiền bằng cách gửi email tới ${SUPPORT_EMAIL} kèm mã đơn. Khi Timi có lỗi khiến bạn không dùng được Pro liên tục trên 3 ngày, Timi hoàn tiền theo tỉ lệ số ngày còn lại.`,
        "Mã giảm giá do Timi phát hành có điều kiện ghi kèm mã, không quy đổi thành tiền.",
      ] }],
    },
    {
      title: "Trợ lý AI",
      blocks: [{ kind: "p", text: "Câu trả lời của trợ lý Timi được tạo bằng mô hình ngôn ngữ và có thể sai. Đó là thông tin tham khảo trên chính số liệu bạn nhập, không phải tư vấn tài chính, đầu tư, thuế hay pháp lý. Bạn tự quyết định với tiền của mình. Số lượt AI tính theo tháng, không cộng dồn, trừ lượt thưởng từ nhiệm vụ có ghi rõ." }],
    },
    {
      title: "Những việc không được làm",
      blocks: [
        { kind: "list", items: [
          "Tìm cách truy cập dữ liệu của người khác hoặc hệ thống của Timi ngoài giao diện thông thường.",
          "Dùng công cụ tự động gọi Timi với tần suất bất thường.",
          "Dùng Timi cho việc trái pháp luật hoặc nhập nội dung xúc phạm, lừa đảo vào phần góp ý và trợ lý.",
        ] },
        { kind: "p", text: "Vi phạm có thể dẫn tới tạm khoá hoặc xoá tài khoản, sau khi Timi thông báo qua email trừ trường hợp khẩn cấp." },
      ],
    },
    {
      title: "Dữ liệu của bạn",
      blocks: [{ kind: "p", text: "Dữ liệu bạn nhập là của bạn. Timi chỉ xử lý để cung cấp dịch vụ, theo Chính sách quyền riêng tư. Bạn xuất được dữ liệu ra file bất cứ lúc nào. Timi sao lưu máy chủ định kỳ nhưng bạn nên giữ bản xuất riêng cho dữ liệu quan trọng." }],
    },
    {
      title: "Tình trạng dịch vụ",
      blocks: [{ kind: "p", text: "Timi đang ở giai đoạn Beta và do một người vận hành. Timi cố gắng chạy liên tục nhưng không cam kết thời gian hoạt động cụ thể; có thể tạm ngưng để bảo trì, thường được báo trước trong app. Timi có thể thêm, đổi hoặc bỏ tính năng; thay đổi lớn được thông báo trong app." }],
    },
    {
      title: "Giới hạn trách nhiệm",
      blocks: [{ kind: "p", text: "Trong phạm vi pháp luật cho phép, Timi không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc dùng hoặc không dùng được Timi, từ số liệu nhập sai, hay từ quyết định tài chính dựa trên thông tin trong Timi. Trách nhiệm của Timi với một người dùng, nếu có, không vượt quá số tiền người đó đã trả cho Timi trong 12 tháng gần nhất." }],
    },
    {
      title: "Chấm dứt",
      blocks: [{ kind: "p", text: "Bạn ngừng dùng Timi bất cứ lúc nào bằng cách xoá tài khoản. Timi có thể ngừng cung cấp dịch vụ với thông báo trước ít nhất 30 ngày để bạn xuất dữ liệu; khi đó phần gói Pro chưa dùng được hoàn tiền theo tỉ lệ." }],
    },
    {
      title: "Luật áp dụng",
      blocks: [{ kind: "p", text: `Điều khoản này theo pháp luật Việt Nam. Tranh chấp được ưu tiên giải quyết bằng thương lượng qua ${SUPPORT_EMAIL}; không xong thì đưa ra toà án có thẩm quyền tại Việt Nam.` }],
    },
    {
      title: "Thay đổi điều khoản",
      blocks: [{ kind: "p", text: "Khi điều khoản thay đổi đáng kể, Timi thông báo trong app trước khi áp dụng. Tiếp tục dùng sau ngày áp dụng nghĩa là bạn chấp nhận bản mới." }],
    },
    {
      title: "Liên hệ",
      blocks: [{ kind: "p", text: `${OPERATOR_NAME}, Việt Nam. Email: ${SUPPORT_EMAIL}.` }],
    },
  ],
}
