/**
 * The app's versions, newest first, as the admin's version history shows
 * them. Every commit that changes the app adds its version here and to
 * package.json: major for a change of the whole app, minor for something
 * new, patch for a fix or a small adjustment.
 */

export type ChangeKind = "new" | "improved" | "fixed"

export type Release = {
  version: string
  /** yyyy-mm-dd */
  date: string
  /** One line on what the version is about. */
  title: string
  changes: { kind: ChangeKind; text: string }[]
}

export type ReleaseLevel = "major" | "minor" | "patch"

export const releaseLevelLabels: Record<ReleaseLevel, string> = {
  major: "Bản lớn",
  minor: "Tính năng mới",
  patch: "Cập nhật nhỏ",
}

export const changeKindLabels: Record<ChangeKind, string> = {
  new: "Mới",
  improved: "Cải tiến",
  fixed: "Sửa lỗi",
}

export const releases: Release[] = [
  {
    version: "6.25.0",
    date: "2026-10-19",
    title: "Thẻ dẫn đầu là thẻ thường",
    changes: [
      { kind: "improved", text: "Năm thẻ dẫn đầu (Tài sản ròng, Tổng số dư, Thu và Chi ở Giao dịch, Cần thu và Cần trả, hồ sơ) không còn đen ở theme sáng và trắng loá ở theme tối: giờ là thẻ trắng như mọi thẻ khác (theme tối xám thẻ), dẫn đầu bằng con số lớn. Các ô bên trong xám rất nhạt, tiền vào màu xanh tiền vào, nhãn tăng trong tháng là ô mực chữ xanh chanh." },
    ],
  },
  {
    version: "6.24.3",
    date: "2026-10-19",
    title: "Thanh tab trong suốt như kính",
    changes: [
      { kind: "improved", text: "Thanh tab trên điện thoại là kính rõ: nền 35% trên nhoè nhẹ 6px, cuộn tới đâu thấy danh sách lộ qua thanh tới đó, icon vẫn tách khỏi nền nhờ nhoè. Mức chọn từ trang thử trên dev server; trang thử và phần đọc mức đã gỡ." },
    ],
  },
  {
    version: "6.24.2",
    date: "2026-10-20",
    title: "Công cụ dev: thử độ trong suốt của thanh tab",
    changes: [{ kind: "new", text: "Chỉ trên dev server: thanh tab đọc mức trong suốt từ trang mockup để so sánh; bản chạy thật không đổi." }],
  },
  {
    version: "6.24.1",
    date: "2026-10-20",
    title: "Số thông báo trên chuông nhích lên",
    changes: [{ kind: "improved", text: "Số chưa đọc trên chuông ở Tổng quan dịch lên 2 điểm, bám vai chuông hơn." }],
  },
  {
    version: "6.24.0",
    date: "2026-10-20",
    title: "Thanh tab theo đúng kit iOS 26 của Apple",
    changes: [
      { kind: "improved", text: "Thanh tab trên điện thoại dựng lại theo file thiết kế iOS 26 của Apple: viên cao 62, nền xám rất nhạt nhoè nền với viền trắng mảnh và bóng mềm, viên của tab đang mở xám #E6E6E6 cao 54 rộng hơn ô 4, tab đang mở màu xanh iOS, icon đặc (Phosphor Fill) trên tên; ô Timi dùng ngôi sao bốn cánh." },
    ],
  },
  {
    version: "6.23.0",
    date: "2026-10-20",
    title: "Thanh tab mới: bốn trang có tên và Timi",
    changes: [
      { kind: "new", text: "Thanh tab trên điện thoại là một viên trải hết bề ngang với tên dưới icon: Tổng quan, Tài khoản, Giao dịch, Vay nợ và Timi ở ô cuối (chạm mở trợ lý). Không còn nút tròn đen rời." },
      { kind: "improved", text: "Cài đặt rời thanh tab: mở từ ảnh đại diện ở đầu trang Tổng quan, cạnh chuông, như App Store đặt tài khoản." },
    ],
  },
  {
    version: "6.22.4",
    date: "2026-10-19",
    title: "Chip tháng âm và thanh hạn mức vượt cùng tông đỏ",
    changes: [
      { kind: "fixed", text: "Trên thẻ dẫn đầu, chip tháng lỗ ở Tài sản ròng và phần tô khi vượt hạn mức dùng cùng tông đỏ hợp nền như số âm (6.22.3)." },
    ],
  },
  {
    version: "6.22.3",
    date: "2026-10-19",
    title: "Chữ đỏ rõ hơn trên thẻ dẫn đầu",
    changes: [
      { kind: "fixed", text: "Số âm và \"vượt\" trên thẻ dẫn đầu dùng đỏ hợp nền: đỏ sáng trên thẻ đen (theme sáng), đỏ đậm trên thẻ trắng (theme tối); trước dùng chung đỏ của trang nên lờ mờ." },
    ],
  },
  {
    version: "6.22.2",
    date: "2026-10-19",
    title: "Thẻ dẫn đầu phẳng hẳn",
    changes: [
      { kind: "improved", text: "Tài sản ròng bỏ hai vòng tròn mờ; thẻ người dùng bỏ quầng xanh chanh và viền quanh avatar. Cả năm thẻ dẫn đầu giờ cùng một kiểu phẳng." },
    ],
  },
  {
    version: "6.22.1",
    date: "2026-10-19",
    title: "Thẻ dẫn đầu về một màu: đen ở theme sáng, trắng ở theme tối",
    changes: [
      { kind: "improved", text: "Cả năm thẻ dẫn đầu (Tài sản ròng, Tổng số dư, Thu / Chi ở Giao dịch, Cần thu / Cần trả, thẻ người dùng) bỏ nền pastel loè loẹt của 6.22.0: theme sáng thẻ đen chữ trắng, theme tối thẻ trắng chữ đen như nút chính (trước là xám nổi). Tài sản ròng giữ hai vòng tròn, thẻ người dùng giữ quầng xanh chanh." },
    ],
  },
  {
    version: "6.22.0",
    date: "2026-10-19",
    title: "Năm thẻ dẫn đầu một dải màu, nút đổi theme ở Tổng quan",
    changes: [
      { kind: "new", text: "Trên điện thoại, Tổng quan có nút đổi giao diện sáng / tối cạnh chuông thông báo." },
      { kind: "improved", text: "Thẻ dẫn đầu của cả năm trang (Tài sản ròng, Tổng số dư, Thu / Chi ở Giao dịch, Cần thu / Cần trả, thẻ người dùng) cùng một họ pastel: ba màu xanh chanh, bạc hà, xanh trời, mỗi thẻ một màu dẫn và một góc sáng riêng. Tài sản ròng không còn là thẻ đen. Theme tối: cùng dải màu, trầm, trên nền thẻ xám." },
    ],
  },
  {
    version: "6.21.5",
    date: "2026-10-19",
    title: "Giao dịch: Thu, Chi và hạn mức trong một thẻ",
    changes: [
      { kind: "improved", text: "Đầu trang Giao dịch gộp hai ô Thu / Chi và thẻ hạn mức thành một thẻ trắng: Thu và Chi hai cột với số giao dịch, dưới là \"Đã dùng … hạn mức tổng · còn …\" với thanh (chỉ tháng hiện tại khi có hạn mức); chạm thẻ mở sheet Hạn mức. Thấp hơn khoảng 40pt. Ghi chú khoản mua bằng hũ chỉ còn trong sheet." },
    ],
  },
  {
    version: "6.21.4",
    date: "2026-10-19",
    title: "Segmented control: viên đen trên rãnh trắng",
    changes: [
      { kind: "improved", text: "Segmented control (Chi tiêu / Thu nhập, Chi tiền / Thu tiền / Chuyển khoản…) đổi kiểu: lựa chọn đang chọn là viên đen chữ trắng như chip đang chọn, rãnh trắng trên nền xám và xám nhạt trong thẻ trắng, thay cho rãnh xám đậm với viên trắng. Theme tối: viên trắng chữ đen." },
    ],
  },
  {
    version: "6.21.3",
    date: "2026-10-19",
    title: "Thẻ Hạn mức tháng này ở Tổng quan gọn hơn",
    changes: [
      { kind: "improved", text: "Thẻ Hạn mức tháng này ở Tổng quan thấp đi gần 40%: số còn lại cỡ vừa, bỏ chữ \"Hạn mức tổng\", vạch chia và \"Theo nhóm\"; mỗi nhóm một dòng với ô icon nhỏ, tên, thanh và phần trăm (\"+250k\" đỏ khi vượt). Ghi chú khoản mua bằng hũ chỉ còn trong sheet Hạn mức." },
    ],
  },
  {
    version: "6.21.2",
    date: "2026-10-18",
    title: "Thẻ trắng nổi hơn trên theme sáng",
    changes: [
      { kind: "improved", text: "Nền trang theme sáng đổi sang xám nhóm của iOS (#f2f2f7), đậm hơn #f7f7f8 một bậc, nên thẻ trắng tách rõ khỏi nền mà không cần bóng; ô icon, đường kẻ, rãnh segmented, thanh trạng thái và ảnh chia sẻ đổi theo. Theme tối không đổi." },
    ],
  },
  {
    version: "6.21.1",
    date: "2026-10-18",
    title: "Tin báo quản trị đến đều hơn",
    changes: [
      { kind: "fixed", text: "Tin báo Telegram của quản trị không còn bị rơi khoảng một phần ba khi máy chủ đi mạng wifi." },
      { kind: "improved", text: "Bot canh gác thử lại khi không gọi được tới Cloudflare và chỉ báo sau ba phút liền, nên bớt báo nhầm lúc mạng của máy canh gác chập chờn." },
    ],
  },
  {
    version: "6.21.0",
    date: "2026-10-18",
    title: "Thẻ Tổng số dư và thẻ người dùng mang nền pastel",
    changes: [
      { kind: "improved", text: "Thẻ Tổng số dư ở Tài khoản và thẻ người dùng ở Cài đặt có nền pastel: lime, bạc hà và xanh trời hoà vào nhau, nhẹ nhàng hơn thẻ đen; theme tối là cùng kiểu, đậm hơn." },
    ],
  },
  {
    version: "6.20.3",
    date: "2026-10-18",
    title: "Quay lại nền xám",
    changes: [
      { kind: "improved", text: "Theme sáng trở lại nền xám với thẻ trắng như trước bản 6.20.0; thanh bên trên máy tính cũng như cũ. Giữ bản sửa viền dưới tiêu đề ngày ở Giao dịch." },
    ],
  },
  {
    version: "6.20.2",
    date: "2026-10-18",
    title: "Viền trên của nhóm giao dịch",
    changes: [
      { kind: "fixed", text: "Ở trang Giao dịch, viền mảnh phía trên mỗi nhóm ngày không còn bị tiêu đề ngày che mất." },
    ],
  },
  {
    version: "6.20.1",
    date: "2026-10-18",
    title: "Thanh bên máy tính nền xám",
    changes: [
      { kind: "improved", text: "Trên máy tính, thanh bên ở giao diện sáng nền xám nhạt (màu nền cũ của app), mục đang mở xám đậm hơn, tách khỏi trang trắng." },
    ],
  },
  {
    version: "6.20.0",
    date: "2026-10-18",
    title: "Giao diện sáng nền trắng",
    changes: [
      { kind: "improved", text: "Giao diện sáng đổi nền từ xám nhạt sang trắng; thẻ và nhóm dòng trắng có viền mảnh và bóng mềm. Giao diện tối giữ nguyên." },
      { kind: "improved", text: "Ô nhập, chip và thanh chọn chế độ xám nhạt ở mọi chỗ; thanh trạng thái theo màu trắng mới." },
    ],
  },
  {
    version: "6.19.6",
    date: "2026-10-18",
    title: "Máy chủ ra Internet bằng đường ổn định hơn",
    changes: [
      { kind: "improved", text: "Máy chủ của Timi chuyển sang đường Internet không đổi IP giữa chừng, nên ít bị gián đoạn hơn." },
    ],
  },
  {
    version: "6.19.5",
    date: "2026-10-18",
    title: "Tunnel tự nối lại nhanh hơn khi mạng nhà chập chờn",
    changes: [
      { kind: "fixed", text: "Khi mạng nhà đổi đường Internet, Timi chỉ mất kết nối khoảng nửa phút tới một, hai phút thay vì tới 10 phút: tunnel bỏ kết nối chết sớm hơn và tự khởi động lại khi cần." },
      { kind: "fixed", text: "Deploy không còn treo nhiều phút ở bước tải mã mới khi mạng chập chờn: quá 2 phút thì dừng và báo lỗi." },
    ],
  },
  {
    version: "6.19.4",
    date: "2026-10-18",
    title: "Tin báo quản trị đúng hơn",
    changes: [
      { kind: "fixed", text: "Bot Telegram của quản trị không còn báo nhầm “Bot canh gác im lặng” 10 phút sau mỗi lần khởi động lại server." },
      { kind: "fixed", text: "Bản tóm tắt buổi tối đếm đúng số lỗi server trong ngày (trước luôn là 0)." },
    ],
  },
  {
    version: "6.19.3",
    date: "2026-10-18",
    title: "Chuyển màn trong sheet chậm lại một chút",
    changes: [
      { kind: "improved", text: "Hiệu ứng trượt khi chuyển màn trong sheet chậm lại (0,5 giây) cho dễ theo dõi." },
    ],
  },
  {
    version: "6.19.2",
    date: "2026-10-18",
    title: "Chuyển màn trong sheet mượt hơn",
    changes: [
      { kind: "fixed", text: "Hiệu ứng trượt khi chuyển màn trong sheet chạy mượt hơn trên iPhone." },
      { kind: "fixed", text: "Lớp mờ dưới thanh trên của sheet không còn tắt đột ngột khi chuyển sang màn khác lúc đang cuộn." },
    ],
  },
  {
    version: "6.19.1",
    date: "2026-10-18",
    title: "Màn sâu trong sheet cũng trượt sang",
    changes: [
      { kind: "improved", text: "Các màn sâu trong sheet (chọn hạng mục, tài khoản, ngân hàng, biểu tượng, người; chi tiết hạn mức và giao dịch của nó; một người trong Danh bạ; bảng lương; một phiên bản; bộ lọc giao dịch; sửa hạng mục) giờ trượt vào từ phải như sheet mở trong sheet, thay vì đổi ngay. Những gì đã nhập vẫn còn khi quay lại." },
    ],
  },
  {
    version: "6.19.0",
    date: "2026-10-18",
    title: "Mở từ trong sheet: trượt sang, không chồng lên",
    changes: [
      { kind: "improved", text: "Mở một thứ từ trong sheet (sửa tài khoản, chi tiết giao dịch trong tài khoản hay lịch, sửa và thu khoản nợ, sửa hũ, gợi ý hạn mức, quản lý hạng mục, thêm người) giờ trượt sang ngay trong sheet đó, có nút ‹ để quay lại, thay vì mở thêm một sheet chồng lên." },
      { kind: "improved", text: "Trên máy tính, phím Esc lùi một màn; ở màn đầu thì đóng sheet." },
    ],
  },
  {
    version: "6.18.0",
    date: "2026-10-18",
    title: "Trên máy tính, sheet trượt vào từ bên phải",
    changes: [
      { kind: "improved", text: "Trên máy tính, các sheet (chi tiết giao dịch, form, hạn mức…) là panel nổi bên phải, trượt vào từ mép phải; đóng bằng ✕, Esc hay bấm ra ngoài. Trên điện thoại giữ như cũ." },
    ],
  },
  {
    version: "6.17.4",
    date: "2026-10-18",
    title: "Nút Xoá dễ đọc hơn ở theme tối",
    changes: [
      { kind: "improved", text: "Ở theme tối, nút Xoá và ô xoá khi vuốt dòng dùng tông đỏ đậm hơn để chữ trắng dễ đọc; chữ đỏ ở nơi khác giữ nguyên." },
    ],
  },
  {
    version: "6.17.3",
    date: "2026-10-18",
    title: "Hũ đoán đúng hơn, bot canh gác được canh lại",
    changes: [
      { kind: "improved", text: "Khi bấm \"Đã mua\" ở một hũ, hạng mục được chọn sẵn theo biểu tượng và tên hũ (ví dụ iPhone → Đồ công nghệ); không chắc thì để bạn tự chọn thay vì chọn bừa." },
      { kind: "improved", text: "Gợi ý biểu tượng hiểu các từ hay gặp: du lịch, cưới, học phí, xe máy, ô tô, điện thoại, quỹ khẩn cấp…, gõ có dấu hay không dấu đều được." },
      { kind: "new", text: "Quản trị viên được báo qua Telegram khi bot canh gác im lặng hơn 10 phút." },
      { kind: "fixed", text: "Ghi nhận thanh toán payOS không còn có thể báo lỗi sau khi đã cấp Pro." },
    ],
  },
  {
    version: "6.17.2",
    date: "2026-10-18",
    title: "Server tự dọn bộ nhớ đệm khi cập nhật",
    changes: [
      { kind: "improved", text: "Mỗi lần cập nhật, server tự dọn phần bộ nhớ đệm cũ không còn dùng, để ổ đĩa không đầy dần." },
    ],
  },
  {
    version: "6.17.1",
    date: "2026-10-18",
    title: "Doanh thu trong bot Telegram tính đúng",
    changes: [
      { kind: "fixed", text: "Bot Telegram tính doanh thu như màn Quản trị: số tiền thực nhận, bỏ các lần cấp Pro đã thu hồi, thay vì giá của đơn." },
    ],
  },
  {
    version: "6.17.0",
    date: "2026-10-18",
    title: "Bot Telegram cho quản trị viên",
    changes: [
      { kind: "new", text: "Quản trị viên nhận tin qua Telegram: Timi không vào được hay đã chạy lại, người dùng mới, mua Pro, mã giảm giá, deploy, backup, lỗi server, server chậm, và tóm tắt mỗi tối." },
    ],
  },
  {
    version: "6.16.3",
    date: "2026-10-18",
    title: "Theo dõi lỗi gọn hơn trên máy chủ",
    changes: [
      { kind: "fixed", text: "Phần theo dõi lỗi trên máy chủ chỉ ghi lỗi, không còn theo từng yêu cầu mạng." },
    ],
  },
  {
    version: "6.16.2",
    date: "2026-10-18",
    title: "Cập nhật danh sách việc còn lại",
    changes: [
      { kind: "improved", text: "Danh sách việc còn lại ghi trang 404, header bảo mật và theo dõi lỗi đã làm, và những gì còn chờ cấu hình." },
    ],
  },
  {
    version: "6.16.1",
    date: "2026-10-18",
    title: "Trang 404 và màn lỗi mới",
    changes: [
      { kind: "improved", text: "Mở một đường dẫn không còn tồn tại, Timi hiện trang riêng với nút về Tổng quan hoặc quay lại." },
      { kind: "improved", text: "Khi một trang không tải được, thẻ báo lỗi mới có nút Thử lại và cho biết dữ liệu của bạn không bị ảnh hưởng; nếu cả app gặp sự cố, có nút Tải lại." },
    ],
  },
  {
    version: "6.16.0",
    date: "2026-10-18",
    title: "An toàn hơn và theo dõi lỗi",
    changes: [
      { kind: "improved", text: "Trang luôn chạy qua HTTPS và không thể bị trang khác nhúng vào; trình duyệt chỉ cho Timi dùng micro, không dùng camera hay vị trí." },
      { kind: "new", text: "Lỗi xảy ra trong app được ghi lại để sửa nhanh hơn, không kèm dữ liệu tài chính hay thông tin cá nhân." },
      { kind: "new", text: "Có đường dẫn kiểm tra app còn hoạt động, để được báo ngay khi Timi không vào được." },
    ],
  },
  {
    version: "6.15.26",
    date: "2026-10-18",
    title: "Cập nhật danh sách việc còn lại",
    changes: [
      { kind: "improved", text: "Danh sách việc còn lại của dự án ghi những gì đã xong về tốc độ và những gì còn cần thử trên iPhone." },
    ],
  },
  {
    version: "6.15.25",
    date: "2026-10-18",
    title: "Chuyển trang trên máy tính phản hồi ngay",
    changes: [
      { kind: "improved", text: "Trên máy tính, bấm một mục ở thanh bên là khung chờ của trang hiện ngay, thay vì đứng yên tới khi máy chủ trả lời." },
    ],
  },
  {
    version: "6.15.24",
    date: "2026-10-17",
    title: "Chạm tab ngay sau khi mở app không còn phải chờ",
    changes: [
      { kind: "fixed", text: "Ngay sau khi mở app, chạm sang tab khác không còn phải chờ tới 2 giây: những việc app tự làm lúc mở (tải thông báo, đồng bộ thiết bị nhận thông báo, hỏi cách nhận giọng nói) không còn chặn việc chuyển trang." },
    ],
  },
  {
    version: "6.15.23",
    date: "2026-10-17",
    title: "Bật bảng ghi tốc độ trong Cài đặt",
    changes: [
      { kind: "new", text: "Quản trị viên bật hoặc tắt bảng ghi tốc độ bằng công tắc \"Ghi tốc độ\" trong Cài đặt, vì app đã cài không có thanh địa chỉ để gõ ?debug=1." },
    ],
  },
  {
    version: "6.15.22",
    date: "2026-10-17",
    title: "Công cụ đo tốc độ trên máy",
    changes: [
      { kind: "new", text: "Mở app với ?debug=1 để hiện bảng ghi thời gian tải trang, chuyển trang và đăng nhập ngay trên máy, kèm nút copy để gửi đi; ?debug=0 để tắt." },
    ],
  },
  {
    version: "6.15.21",
    date: "2026-10-17",
    title: "Mở lại app và huỷ đăng nhập nhanh hơn",
    changes: [
      { kind: "fixed", text: "Mở lại app sau khi có bản mới, app tự tải bản mới ngay lúc mở thay vì để lần chuyển trang đầu tiên phải tải lại cả app (màn hình đen vài giây)." },
      { kind: "fixed", text: "Đóng cửa sổ chọn tài khoản Google, app báo huỷ sau khoảng 3 giây thay vì tới 10 giây." },
    ],
  },
  {
    version: "6.15.20",
    date: "2026-10-17",
    title: "Cài đặt của quản trị viên nhẹ hơn",
    changes: [
      { kind: "improved", text: "Trang Cài đặt của quản trị viên không còn tải sẵn danh sách người dùng và thông báo đã gửi; hai màn này tự tải khi mở." },
    ],
  },
  {
    version: "6.15.19",
    date: "2026-10-17",
    title: "Trang nhẹ hơn, đăng nhập Google chỉ chuẩn bị ở trang đăng nhập",
    changes: [
      { kind: "improved", text: "Trên điện thoại, các trang trong app không còn tải khung đăng nhập của Google; việc đó chỉ làm ở trang đăng nhập, ngay khi mở trang." },
      { kind: "improved", text: "Trợ lý Timi, form thêm giao dịch, khoản nợ, tài khoản và màn gói tải riêng lúc máy rảnh, nên các tab chính nhẹ hơn khoảng 20–38 KB." },
      { kind: "improved", text: "Logo ngân hàng và ví nhẹ hơn, danh sách chọn ngân hàng chỉ tải logo khi cuộn tới." },
      { kind: "improved", text: "Máy chủ ghi lại trang, truy vấn và lần kiểm tra phiên chậm để đo tốc độ thật." },
    ],
  },
  {
    version: "6.15.18",
    date: "2026-10-17",
    title: "Mở app và chuyển trang nhanh hơn",
    changes: [
      { kind: "improved", text: "Mỗi trang không còn chờ kiểm tra phiên đăng nhập với Google ở mọi lần mở, nên hiện nhanh hơn khoảng 0,3 giây." },
      { kind: "improved", text: "Mở app không còn tạo lại phiên đăng nhập mỗi lần; phiên chỉ được gia hạn khi sắp hết." },
      { kind: "improved", text: "Biểu đồ và ghi chú phát hành tải sau trang, nên Tổng quan, Giao dịch và Cài đặt nhẹ hơn khoảng một phần tư." },
      { kind: "improved", text: "Chuyển giữa các tab không còn hỏi lại thông báo mỗi lần; kết nối tới máy chủ ổn định hơn." },
    ],
  },
  {
    version: "6.15.17",
    date: "2026-10-17",
    title: "Nút Hoàn tác cách mép đều hơn",
    changes: [
      { kind: "improved", text: "Trong thông báo nhanh, nút Hoàn tác lùi vào một chút, cách mép phải bằng khoảng cách tới mép trên và dưới." },
    ],
  },
  {
    version: "6.15.16",
    date: "2026-10-17",
    title: "Thông báo nhanh về lại cỡ cũ",
    changes: [
      { kind: "improved", text: "Thông báo nhanh giữ màu trắng mới nhưng về lại cỡ cũ: cao hơn, rộng hơn, nút Hoàn tác to hơn." },
    ],
  },
  {
    version: "6.15.15",
    date: "2026-10-17",
    title: "Thông báo nhanh kiểu mới",
    changes: [
      { kind: "improved", text: "Thông báo nhanh (Đã lưu, Hoàn tác…) là thẻ trắng nhỏ gọn hơn, có ô biểu tượng màu và nổi rõ trên trang; ở theme tối là thẻ xám nổi." },
      { kind: "improved", text: "Thông báo lại hiện ở đầu màn hình cả khi một sheet đang mở, như trước bản 6.15.6." },
    ],
  },
  {
    version: "6.15.14",
    date: "2026-10-17",
    title: "Chi tiết khoản nợ mở ngay khi chạm",
    changes: [
      { kind: "improved", text: "Chạm một khoản ở trang Vay nợ, kể cả khoản đã tất toán, chi tiết và lịch sử trả hiện ngay, không còn chờ tải." },
    ],
  },
  {
    version: "6.15.13",
    date: "2026-10-17",
    title: "Hạn mức tổng tính cả phí chuyển khoản và lãi vay",
    changes: [
      { kind: "improved", text: "Hạn mức tổng tính cả phí chuyển khoản và lãi đi vay, như ô Chi; dưới hạn mức ghi rõ phần không tính (mua bằng hũ, điều chỉnh số dư), cả ở dòng hạn mức trang Giao dịch." },
      { kind: "improved", text: "Thanh hạn mức chuyển vàng theo mốc báo sớm đã chọn trong Cảnh báo hạn mức (80% hay 90%)." },
      { kind: "improved", text: "Form chuyển khoản báo khi phí làm vượt hạn mức tổng; form chi ghi phần còn lại như dòng nhóm (còn bao nhiêu, mỗi ngày bao nhiêu)." },
      { kind: "fixed", text: "Tháng đã qua: chi của nhóm đã xoá, phí chuyển khoản và lãi vay có dòng riêng, các dòng cộng đúng bằng tổng." },
      { kind: "fixed", text: "Gợi ý \"Hạn mức có thể quá cao\" không còn đề xuất số lớn hơn hạn mức hiện tại." },
      { kind: "fixed", text: "Phần trăm đã dùng làm tròn xuống khi chưa vượt (không còn hiện 100% khi vẫn còn tiền)." },
      { kind: "fixed", text: "Bỏ \"Ngoài báo cáo\" của tài khoản, lưu phí chuyển khoản hay khoản trả nợ có lãi giờ cũng gửi cảnh báo hạn mức khi chạm mốc." },
    ],
  },
  {
    version: "6.15.12",
    date: "2026-10-17",
    title: "Chuyển tháng ở Tổng quan dùng lại hiệu ứng cũ",
    changes: [
      { kind: "improved", text: "Lịch thu chi ở Tổng quan trở lại hiệu ứng trượt của bản 6.15.10; vòng hạng mục lại đổi tháng ngay khi lịch đổi." },
    ],
  },
  {
    version: "6.15.11",
    date: "2026-10-17",
    title: "Chuyển tháng ở Tổng quan mượt hơn",
    changes: [
      { kind: "improved", text: "Lịch thu chi ở Tổng quan trượt sang tháng khác bằng hiệu ứng của trình duyệt, mượt hơn trên iPhone; vòng hạng mục vẽ lại sau khi lịch trượt xong." },
    ],
  },
  {
    version: "6.15.10",
    date: "2026-10-17",
    title: "Lịch thu chi ghi số tiền chính xác hơn",
    changes: [
      { kind: "fixed", text: "Ô ngày trong lịch ở Tổng quan ghi số triệu kèm một chữ số thập phân (17,6tr), không còn làm tròn thành 18tr." },
    ],
  },
  {
    version: "6.15.9",
    date: "2026-10-17",
    title: "Nút trên sheet không bị dòng che",
    changes: [
      { kind: "fixed", text: "Giữ chuột hoặc ngón tay trên một dòng rồi cuộn lên, nền xám của dòng không còn đè lên nút đóng, quay lại và sửa ở đầu sheet." },
    ],
  },
  {
    version: "6.15.8",
    date: "2026-10-17",
    title: "Sửa trang Tổng quan sau một lượt test",
    changes: [
      { kind: "fixed", text: "Biểu đồ thu chi 6 tháng: trục bên trái không còn cắt mất chữ số đầu khi một tháng từ 1 tỷ trở lên, các mốc tròn và ghi tỷ đúng đơn vị; dòng số của tháng đang chọn không còn xuống dòng." },
      { kind: "fixed", text: "Lịch: ngày chỉ có khoản vay hoặc cho vay mở ra có khoản đó, thay vì \"Chưa có giao dịch\"." },
      { kind: "fixed", text: "Tài sản ròng ghi cả khoản vay đi từ tài khoản ngoài báo cáo (đã không tính vào \"Cho vay\"), nên con số khớp được với trang Vay nợ; số rất lớn tự thu nhỏ cho vừa một dòng." },
      { kind: "fixed", text: "Theo hạng mục ghi tên tháng khi lịch đang ở tháng khác, câu trống nói đúng tháng đó, \"Xem tất cả\" mở giao dịch của tháng đó; hạng mục rất nhỏ ghi \"<1%\" thay vì 0%." },
      { kind: "fixed", text: "Màn chờ có sẵn chỗ cho Nhiệm vụ và Hạn mức, nên lịch không còn bị đẩy xuống khi trang tải xong." },
      { kind: "improved", text: "Hạn mức vượt quá xa ghi \">999%\"; tiêu đề Nhiệm vụ không còn để chữ \"AI\" một mình trên màn hình hẹp." },
    ],
  },
  {
    version: "6.15.7",
    date: "2026-10-17",
    title: "Danh sách việc còn lại",
    changes: [
      { kind: "improved", text: "Gom các việc đã bàn nhưng chưa làm vào docs/backlog.md (không đổi gì trong app)." },
    ],
  },
  {
    version: "6.15.6",
    date: "2026-10-17",
    title: "Cài đặt: chín chỗ sửa từ một lượt thử trang",
    changes: [
      { kind: "fixed", text: "Đổi cảnh báo hạn mức trong sheet Hạn mức, dòng ở Cài đặt › Thông báo cập nhật ngay, không còn ghi mức cũ tới khi tải lại." },
      { kind: "fixed", text: "Đóng màn mở từ một liên kết (lịch sử phiên bản, nhắc ghi chi tiêu, gói), tải lại trang không còn mở lại màn đó." },
      { kind: "fixed", text: "Không tạo được hai nhóm cùng tên trong một loại, hay hai hạng mục cùng tên trong một nhóm (không phân biệt hoa thường)." },
      { kind: "fixed", text: "Xoá nhóm có hạn mức: câu hỏi nói hạn mức cũng bị xoá, và hạn mức được xoá theo nhóm." },
      { kind: "improved", text: "Dòng cảnh báo trong Cài đặt › Thông báo đổi tên thành Cảnh báo hạn mức, khỏi trùng với dòng Hạn mức chi tiêu." },
      { kind: "improved", text: "Thông báo ngắn hiện dưới thanh nút của sheet, không che nút Đóng hay Quay lại." },
      { kind: "improved", text: "Khung chờ của trang Cài đặt khớp với trang thật, không còn nhảy khi tải xong." },
      { kind: "fixed", text: "Quản trị: hẹn gửi thông báo vào giờ đã qua được báo ngay dưới ô giờ; đóng khi đang soạn dở thì được hỏi trước khi bỏ nháp." },
    ],
  },
  {
    version: "6.15.5",
    date: "2026-10-17",
    title: "Sheet quay lại không nháy header",
    changes: [
      { kind: "fixed", text: "Quay lại màn trước trong một sheet, header không còn nháy mất lớp mờ rồi hiện lại khi màn vừa rời chưa cuộn." },
    ],
  },
  {
    version: "6.15.4",
    date: "2026-10-17",
    title: "Vay nợ: mở khoản khác không còn thoáng hiện khoản trước",
    changes: [
      { kind: "fixed", text: "Đóng một khoản rồi mở khoản khác, sheet không còn hiện thông tin khoản trước trong chốc lát rồi mới đổi." },
    ],
  },
  {
    version: "6.15.3",
    date: "2026-10-17",
    title: "Vay nợ: mở đúng khoản từ nơi khác, list không tràn",
    changes: [
      { kind: "fixed", text: "“Mở trong Vay nợ” ở Giao dịch, khoản sắp đến hạn ở Tổng quan và thông báo đến hạn giờ mở thẳng chi tiết khoản đó, không chỉ dừng ở danh sách." },
      { kind: "fixed", text: "Khoản có ghi chú dài không còn làm cả nhóm Cần thu/Cần trả tràn ngang trên điện thoại (số tiền bị đẩy ra ngoài màn hình)." },
      { kind: "fixed", text: "Bấm Hoàn tác trên thông báo không còn đóng sheet đang mở, ví dụ sau khi xoá một lần thu nợ." },
      { kind: "fixed", text: "Lỗi khi lưu hiện trên nền riêng, không đè lên các dòng phía sau, và tự mất khi sửa lại form." },
      { kind: "improved", text: "Banner tách khoản quá hạn với khoản đến hạn hôm nay (“2 quá hạn · 1 đến hạn hôm nay”); danh bạ ghi “Đến hạn hôm nay” thay vì “Quá hạn”." },
      { kind: "improved", text: "Lãi suất quá 2 số thập phân được báo ngay ở ô lãi; hạ số tiền khoản xuống dưới số đã thu/trả có câu báo rõ ràng." },
      { kind: "improved", text: "Số tiền rất lớn ở thẻ tổng thu nhỏ hoặc ghi gọn thay vì ngắt giữa số; khoản vay mới trên trang Giao dịch mang giờ lúc ghi thay vì 00:00." },
    ],
  },
  {
    version: "6.15.2",
    date: "2026-10-17",
    title: "Giao dịch: tìm kiếm, bộ lọc và xoá chính xác hơn",
    changes: [
      { kind: "fixed", text: "Tìm giao dịch không còn ra kết quả lạ khi gõ số hoặc vài chữ cái ngắn (trước đây khớp cả mã ẩn của giao dịch)." },
      { kind: "fixed", text: "Chip “Lọc” đếm một khoảng số tiền là một điều kiện, khớp với số chip đang lọc; khoản đúng 100k hoặc 1tr chỉ nằm trong một mốc số tiền." },
      { kind: "fixed", text: "Ghi giao dịch ngay sau khi mở tài khoản không còn báo nhầm “trước lúc mở”; khi trước giờ mở trong cùng ngày, câu nhắc ghi rõ giờ." },
      { kind: "improved", text: "Xoá giao dịch: dòng biến mất ngay (Hoàn tác đưa lại), thông báo ghi số tiền và ngày, và rời app trong 6 giây vẫn xoá như đã báo." },
      { kind: "improved", text: "Gợi ý số tiền không còn đưa số tỷ khi đã gõ đủ số tiền; chip số tiền ghi gọn như trong bộ lọc (100k – 1tr)." },
      { kind: "improved", text: "Tháng cũ chưa có giao dịch nhắc cách ghi bù; dòng hạn mức tổng xuống hai dòng thay vì bị cắt trên điện thoại hẹp; nút xoá tìm kiếm và nút đổi chiều chuyển khoản dễ bấm hơn." },
    ],
  },
  {
    version: "6.15.1",
    date: "2026-10-17",
    title: "Hạn mức nhóm cộng lại không vượt hạn mức tổng",
    changes: [
      { kind: "improved", text: "Hạn mức các nhóm cộng lại không được vượt hạn mức tổng: đặt một nhóm thì form nói còn chia được bao nhiêu (ví dụ tổng 7tr, hai nhóm 3tr thì nhóm mới tối đa 1tr); hạ hạn mức tổng không được thấp hơn phần đã chia." },
    ],
  },
  {
    version: "6.15.0",
    date: "2026-10-17",
    title: "Hạn mức tổng rõ ràng, nhóm không vượt tổng",
    changes: [
      { kind: "new", text: "Hạn mức của một nhóm không thể lớn hơn hạn mức tổng, và hạn mức tổng không thể hạ dưới một nhóm: form báo ngay khi gõ." },
      { kind: "improved", text: "Thẻ đầu sheet Hạn mức có tiêu đề \"Hạn mức tổng\" và dòng \"Đã chia cho nhóm\" (báo khi các nhóm cộng lại vượt tổng); danh sách bên dưới là \"Hạn mức theo nhóm\"; thẻ ở Tổng quan cũng ghi rõ." },
    ],
  },
  {
    version: "6.14.2",
    date: "2026-10-17",
    title: "Màn tải Giao dịch có dòng hạn mức",
    changes: [
      { kind: "improved", text: "Khi trang Giao dịch đang tải, dòng hạn mức tổng đã có khung chờ cùng kích thước, nên nội dung không bị đẩy xuống khi tải xong." },
    ],
  },
  {
    version: "6.14.1",
    date: "2026-10-17",
    title: "Sheet nhớ chỗ đã cuộn khi quay lại",
    changes: [
      { kind: "fixed", text: "Trong mọi sheet, mở một màn sâu hơn rồi bấm ‹ quay lại thì về đúng chỗ đã cuộn, kể cả khi đi sâu nhiều màn (ví dụ Hạn mức → Ăn uống → giao dịch)." },
    ],
  },
  {
    version: "6.14.0",
    date: "2026-10-17",
    title: "Xem giao dịch ngay trong Hạn mức",
    changes: [
      { kind: "new", text: "Trong chi tiết hạn mức, \"Xem tất cả giao dịch\", một hạng mục con hay nhóm chưa đặt hạn mức mở danh sách giao dịch ngay trong sheet; chạm một giao dịch để xem, sửa hay xoá, rồi quay lại, không phải sang trang Giao dịch." },
    ],
  },
  {
    version: "6.13.4",
    date: "2026-10-17",
    title: "Thẻ hạn mức ở Tổng quan nói rõ khoản mua bằng hũ",
    changes: [
      { kind: "improved", text: "Thẻ \"Hạn mức tháng này\" ở Tổng quan ghi \"Không tính … mua bằng hũ tiết kiệm\" khi có, như trong sheet Hạn mức." },
      { kind: "improved", text: "Chú thích biểu đồ các tháng ngắn gọn hơn." },
    ],
  },
  {
    version: "6.13.3",
    date: "2026-10-17",
    title: "Trục số của đồ thị hạn mức hiện đủ",
    changes: [
      { kind: "fixed", text: "Đồ thị chi theo ngày và so với các tháng trước không còn cắt số ở trục dọc khi số tiền lớn (như 20,9tr); từ một tỷ ghi \"tỷ\"." },
    ],
  },
  {
    version: "6.13.2",
    date: "2026-10-17",
    title: "Sheet hạn mức mở không còn nháy",
    changes: [
      { kind: "fixed", text: "Mở sheet Hạn mức, thẻ đầu không còn hiện một dòng đang tải ở đáy rồi biến mất: dòng \"tháng gần đây trong hạn mức\" có sẵn ngay khi mở." },
    ],
  },
  {
    version: "6.13.1",
    date: "2026-10-17",
    title: "Đồ thị chi theo ngày mượt hơn",
    changes: [
      { kind: "improved", text: "Đường chi theo ngày trong chi tiết hạn mức (cả hạn mức tổng và từng nhóm) là đường cong mượt thay cho bậc thang." },
    ],
  },
  {
    version: "6.13.0",
    date: "2026-10-17",
    title: "Gợi ý chỉnh hạn mức, cài đặt thông báo hạn mức",
    changes: [
      { kind: "new", text: "Khi hạn mức lệch xa mức chi mấy tháng gần đây, màn chi tiết gợi ý \"Hạn mức có thể quá thấp\" hay \"quá cao\", đổi nhanh bằng một chạm hoặc để sau tới hết tháng." },
      { kind: "new", text: "Cài đặt › Thông báo › Hạn mức chi tiêu: bật tắt thông báo hạn mức và chọn báo trước khi dùng 80%, 90% hay chỉ báo khi vượt." },
    ],
  },
  {
    version: "6.12.0",
    date: "2026-10-17",
    title: "Tin từ Timi",
    changes: [
      { kind: "new", text: "Tin từ Timi: tính năng mới, ưu đãi và thông tin quan trọng hiện trong chuông thông báo với icon Timi, chạm để mở đúng chỗ." },
      { kind: "new", text: "Cài đặt › Thông báo có công tắc \"Tin từ Timi\": tắt thì tin vẫn hiện trong chuông, chỉ không đẩy tới máy." },
    ],
  },
  {
    version: "6.11.0",
    date: "2026-10-17",
    title: "Đặt hạn mức theo gợi ý, báo trước khi vượt",
    changes: [
      { kind: "new", text: "Chưa có hạn mức thì Tổng quan mời đặt: \"Đặt theo gợi ý\" điền sẵn hạn mức tổng và từng nhóm theo mức chi trung bình 3 tháng gần nhất, sửa hay bỏ từng số rồi lưu một lần." },
      { kind: "new", text: "Khi ghi khoản chi, nếu số tiền làm nhóm hay hạn mức tổng vượt, dòng dưới hạng mục báo đỏ trước khi lưu, ví dụ \"Khoản này làm Ăn uống vượt 50k\"." },
    ],
  },
  {
    version: "6.10.3",
    date: "2026-10-17",
    title: "Hạn mức tính đúng từ tháng đặt",
    changes: [
      { kind: "fixed", text: "Tháng trước khi đặt hạn mức không còn bị tính là vượt: chỉ ghi số đã chi và \"Chưa đặt hạn mức trong tháng này\"; thành tích chỉ đếm từ tháng đặt." },
      { kind: "fixed", text: "Xem tháng cũ liệt kê cả các nhóm chưa đặt hạn mức kèm số đã chi, để các phần cộng đủ tổng." },
      { kind: "fixed", text: "Màu thanh hạn mức giống nhau ở mọi nơi (cam khi từ 80% hay đang chi nhanh so với số ngày đã qua)." },
      { kind: "improved", text: "Ghi rõ \"Không tính … mua bằng hũ tiết kiệm\" khi có, vì các trang khác vẫn tính khoản này." },
      { kind: "improved", text: "Biểu đồ chi theo ngày là bậc thang; biểu đồ các tháng chỉ hiện tháng có dữ liệu, cột nhỏ vẫn nhìn thấy; danh sách giao dịch có tiêu đề \"Giao dịch tháng này\"; câu chữ rõ hơn (\"3/4 tháng gần đây trong hạn mức\", \"Chi ít hơn dự kiến\")." },
    ],
  },
  {
    version: "6.10.2",
    date: "2026-10-17",
    title: "Biểu đồ tròn của hạn mức chạm là xem số",
    changes: [
      { kind: "fixed", text: "Chạm vào biểu đồ tròn trong chi tiết hạn mức không còn mở màn khác: hiện tên và số tiền phần đó; chạm các dòng bên dưới mới mở." },
      { kind: "improved", text: "Hạn mức cả tháng gọi là \"Hạn mức tổng\" ở mọi chỗ: tiêu đề màn chi tiết, dòng ở Giao dịch, form, thông báo." },
    ],
  },
  {
    version: "6.10.1",
    date: "2026-10-17",
    title: "Hạn mức gọn và dễ đọc hơn",
    changes: [
      { kind: "improved", text: "Chi theo hạng mục và theo nhóm trong chi tiết hạn mức là biểu đồ tròn, chạm từng phần để xem tiếp." },
      { kind: "improved", text: "Biểu đồ chi theo ngày bỏ đường \"đúng kế hoạch\", chỉ còn đường chi và vạch hạn mức." },
      { kind: "improved", text: "Lời văn gọn hơn: \"Còn lại\" thay \"Còn được chi\", \"Đang chi nhanh\" thay \"Chi nhanh hơn kế hoạch\", \"Đã dùng 77% hạn mức khi tháng mới qua 17 ngày\"." },
    ],
  },
  {
    version: "6.10.0",
    date: "2026-10-17",
    title: "Hạn mức chi tiết hơn",
    changes: [
      { kind: "new", text: "Chạm một nhóm (hay thẻ cả tháng) trong Hạn mức để xem chi tiết: chi luỹ kế theo ngày so với kế hoạch, chia theo hạng mục (hay theo nhóm), so với 6 tháng trước, các khoản chi mới nhất." },
      { kind: "new", text: "Xem lại các tháng trước bằng ‹ ›: giữ được hay vượt hạn mức, dư hay vượt bao nhiêu; kèm \"Giữ được hạn mức x/6 tháng trước đó\"." },
      { kind: "improved", text: "\"Xem tất cả giao dịch\" mở trang Giao dịch lọc sẵn theo nhóm của tháng đó." },
    ],
  },
  {
    version: "6.9.1",
    date: "2026-10-17",
    title: "Sheet chọn tháng gọn trên máy tính",
    changes: [
      { kind: "improved", text: "Trên máy tính, sheet chọn tháng (và các sheet kéo từ dưới lên) rộng vừa phải và nằm giữa, không trải hết màn hình." },
    ],
  },
  {
    version: "6.9.0",
    date: "2026-10-16",
    title: "Hạn mức chi tiêu",
    changes: [
      { kind: "new", text: "Đặt hạn mức chi mỗi tháng, cho cả tháng và cho từng nhóm hạng mục; tự lặp lại mỗi tháng, gợi ý bằng mức chi trung bình 3 tháng gần nhất." },
      { kind: "new", text: "Thẻ \"Hạn mức tháng này\" ở Tổng quan, dòng \"Đã dùng …% hạn mức tháng\" ở Giao dịch và mục \"Hạn mức chi tiêu\" trong Cài đặt: còn được chi, còn bao nhiêu mỗi ngày, đang chi nhanh hay chậm hơn kế hoạch." },
      { kind: "new", text: "Khi ghi khoản chi, dưới hạng mục hiện nhóm đó còn bao nhiêu tháng này." },
      { kind: "new", text: "Thông báo khi một hạn mức chạm 80% và khi vượt." },
    ],
  },
  {
    version: "6.8.7",
    date: "2026-10-16",
    title: "Trang Tài khoản gọn chữ hơn",
    changes: [
      { kind: "improved", text: "Chi tiết tài khoản: ngày bắt đầu gộp vào dòng dưới số dư; giao dịch gần đây chỉ ghi ngày (bỏ \"còn …\")." },
      { kind: "improved", text: "Chi tiết hũ bỏ dòng Mục tiêu (đã có \"% của …\"); sheet rút bỏ dòng \"Trong hũ đang có\"; thông báo đủ tiền ngắn lại." },
      { kind: "improved", text: "Thẻ tài khoản trên máy tính bỏ chữ \"Số dư\"; các câu thông báo xoá, mua hũ, ngày mua, khoá tài khoản ngắn và rõ hơn; tên hũ trong thông báo có ngoặc kép." },
    ],
  },
  {
    version: "6.8.6",
    date: "2026-10-16",
    title: "Chi tiết tài khoản gọn hơn",
    changes: [
      { kind: "improved", text: "Bỏ dòng Số dư ban đầu và Đã tăng / Đã giảm ở chi tiết tài khoản." },
    ],
  },
  {
    version: "6.8.5",
    date: "2026-10-16",
    title: "Bỏ viền quanh nút tròn trên sheet (theme tối)",
    changes: [
      { kind: "improved", text: "Ở theme tối, nút ✕ và các nút tròn trên thanh của sheet không còn vòng viền mỏng bao ngoài." },
    ],
  },
  {
    version: "6.8.4",
    date: "2026-10-16",
    title: "Nút Xoá đỏ đặc",
    changes: [
      { kind: "improved", text: "Nút Xoá ở chân các sheet (và nút xoá dữ liệu) là đỏ đặc chữ trắng, thay cho nền đỏ nhạt trông mờ ở cả hai theme." },
    ],
  },
  {
    version: "6.8.3",
    date: "2026-10-16",
    title: "Theme tối kiểu iOS",
    changes: [
      { kind: "improved", text: "Theme tối theo iOS: nền đen #000, thẻ #1c1c1e, ô và thẻ nổi #2c2c2e, đường kẻ #38383a; thẻ tách khỏi nền rõ hơn. Thanh trạng thái đổi theo." },
    ],
  },
  {
    version: "6.8.2",
    date: "2026-10-16",
    title: "Logo ngân hàng và ví hiện ngay",
    changes: [
      { kind: "improved", text: "Logo ngân hàng và ví điện tử được lưu lại trên máy 30 ngày và hiện ngay khi mở form hay đổi giữa Ngân hàng và Ví điện tử, không phải tải lại mỗi lần." },
      { kind: "improved", text: "Logo Bảo Việt, Đông Á và Bắc Á nhẹ hơn (tổng từ 425KB còn 270KB), hình không đổi." },
    ],
  },
  {
    version: "6.8.1",
    date: "2026-10-16",
    title: "Sửa lỗi hiển thị trang Tài khoản",
    changes: [
      { kind: "fixed", text: "Tổng số dư từ 100 triệu trở lên không còn bị ngắt xuống dòng giữa số trên điện thoại; số nhỏ lại cho vừa một dòng." },
      { kind: "fixed", text: "Tên hũ giữ nguyên như đã gõ trong thông báo đủ tiền và sheet Đã mua (trước bị đổi thành chữ thường, ví dụ \"iPhone\" thành \"iphone\")." },
    ],
  },
  {
    version: "6.8.0",
    date: "2026-10-16",
    title: "Xoá toàn bộ dữ liệu",
    changes: [
      { kind: "new", text: "Cài đặt có dòng \"Xoá toàn bộ dữ liệu\": xoá tài khoản, hũ, giao dịch, vay nợ, danh bạ và đưa hạng mục về mặc định, sau khi gõ XOÁ để xác nhận. Tài khoản đăng nhập, gói Pro, lượt AI và giờ nhắc vẫn giữ." },
    ],
  },
  {
    version: "6.7.8",
    date: "2026-10-16",
    title: "Bỏ đường kẻ dưới thanh trên",
    changes: [
      { kind: "improved", text: "Bỏ lại đường kẻ dưới thanh trên cùng trên máy tính (thêm ở 6.7.7)." },
    ],
  },
  {
    version: "6.7.7",
    date: "2026-10-16",
    title: "Đường kẻ dưới thanh trên (máy tính)",
    changes: [
      { kind: "improved", text: "Trên máy tính, thanh trên cùng có đường kẻ mảnh ngăn với nội dung trang." },
    ],
  },
  {
    version: "6.7.6",
    date: "2026-10-16",
    title: "Thẻ nổi nhẹ trên nền sáng",
    changes: [
      { kind: "improved", text: "Ở theme sáng, thẻ trắng có bóng rất mờ để tách khỏi nền xám nhạt; theme tối giữ nguyên." },
    ],
  },
  {
    version: "6.7.5",
    date: "2026-10-16",
    title: "Hũ đã mua ghi đúng tên",
    changes: [
      { kind: "fixed", text: "Ở bộ lọc và khi chọn tài khoản, hũ đã hoàn thành ghi \"đã mua\" thay vì \"đã khoá\"." },
    ],
  },
  {
    version: "6.7.4",
    date: "2026-10-16",
    title: "Nền sáng xám nhạt",
    changes: [
      { kind: "improved", text: "Theme sáng đổi nền từ kem ấm (#f5f4f0, trông hơi vàng) sang xám rất nhạt (#f7f7f8); ô mờ, đường kẻ và thanh trạng thái đổi theo." },
    ],
  },
  {
    version: "6.7.3",
    date: "2026-10-16",
    title: "Danh sách tài khoản gọn hơn",
    changes: [
      { kind: "improved", text: "Trên điện thoại, dòng tài khoản chỉ còn tên, bỏ dòng loại tài khoản bên dưới (vẫn giữ \"Ngoài báo cáo\")." },
      { kind: "improved", text: "Trên máy tính, thẻ tài khoản và thẻ thêm tài khoản thấp lại cho vừa nội dung." },
    ],
  },
  {
    version: "6.7.2",
    date: "2026-10-16",
    title: "Bỏ Tiền vào / Tiền ra của tài khoản",
    changes: [
      { kind: "improved", text: "Bỏ Tiền vào / Tiền ra tháng này ở chi tiết tài khoản và trên thẻ tài khoản (máy tính), vì con số gồm cả chuyển khoản và điều chỉnh số dư nên dễ hiểu lầm. Thẻ tài khoản gọn lại: tên ở trên, số dư ở dưới." },
    ],
  },
  {
    version: "6.7.1",
    date: "2026-10-16",
    title: "Hũ đã hoàn thành chỉ đổi tên",
    changes: [
      { kind: "improved", text: "Sửa hũ đã hoàn thành chỉ còn đổi tên và xoá; mục tiêu, biểu tượng, màu và hạn giữ như lúc mua." },
    ],
  },
  {
    version: "6.7.0",
    date: "2026-10-16",
    title: "Hũ tự đặt tên, chọn biểu tượng và màu",
    changes: [
      { kind: "new", text: "Tạo hoặc sửa hũ: tự gõ tên, chọn biểu tượng trong bộ khoảng 200 biểu tượng của app (gợi ý theo tên, có ô tìm) và chọn màu, như khi sửa danh mục." },
      { kind: "improved", text: "Biểu tượng của hũ có màu của hũ ở danh sách, thẻ và chi tiết hũ. Các hũ cũ giữ biểu tượng gần nhất và màu cũ." },
    ],
  },
  {
    version: "6.6.8",
    date: "2026-10-16",
    title: "Sửa lỗi hũ quá hạn và xoá hũ",
    changes: [
      { kind: "fixed", text: "Hũ đã quá hạn sửa được mà không phải đổi hạn; hũ ghi \"đã quá hạn\" thay vì \"còn 1 tháng\" và không còn gợi ý số tiền mỗi tháng." },
      { kind: "fixed", text: "Xoá hũ được cả khi tài khoản từng nạp vào hũ nay đã khoá; tiền vẫn về lại tài khoản đó." },
      { kind: "fixed", text: "Thẻ Tổng số dư không còn dòng \"Hũ tiết kiệm 0đ\" khi chỉ còn hũ đã hoàn thành." },
    ],
  },
  {
    version: "6.6.7",
    date: "2026-10-16",
    title: "Nút Xoá và Lưu về cỡ thường",
    changes: [
      { kind: "improved", text: "Nút Xoá có chữ và nút Lưu ở chân các sheet sửa về lại cao 44px; nút Xoá vẫn rộng và có chữ cho dễ bấm." },
    ],
  },
  {
    version: "6.6.6",
    date: "2026-10-16",
    title: "Nút xoá dễ bấm hơn",
    changes: [
      { kind: "improved", text: "Ở chân các sheet sửa (tài khoản, giao dịch, khoản nợ, lần trả nợ, danh mục, hũ), nút Xoá có chữ và cao 56px như nút Lưu, thay cho nút tròn nhỏ." },
    ],
  },
  {
    version: "6.6.5",
    date: "2026-10-16",
    title: "Sửa lỗi hũ tiết kiệm và trang tài khoản",
    changes: [
      { kind: "fixed", text: "Hũ không bao giờ bị âm: không rút quá số tiền đang có, kể cả khi sửa hay xoá giao dịch nạp." },
      { kind: "fixed", text: "Ngày mua không được trước lần nạp rút gần nhất của hũ; hũ hoàn thành đúng vào ngày mua đã chọn." },
      { kind: "fixed", text: "Số tiền nên nạp mỗi tháng làm tròn theo cỡ mục tiêu (500k trong 15 tháng là 34k, không còn 100k)." },
      { kind: "improved", text: "Nạp, rút hay mua khi mọi tài khoản đều đã khoá thì báo không có tài khoản nào khả dụng." },
      { kind: "fixed", text: "Khoá tài khoản cuối cùng thì nhóm Đã khoá mở ra ngay; link tới một hũ mở đúng sheet của hũ." },
      { kind: "fixed", text: "Thẻ nét đứt thêm tài khoản, thêm hũ lún xuống khi bấm giống các thẻ khác." },
    ],
  },
  {
    version: "6.6.4",
    date: "2026-10-14",
    title: "Hũ dạng thẻ trên máy tính",
    changes: [
      { kind: "improved", text: "Trên máy tính, hũ tiết kiệm hiện thành thẻ lớn như tài khoản, có mục tiêu và số nên nạp mỗi tháng." },
      { kind: "improved", text: "Thêm tài khoản và thêm hũ bằng thẻ viền nét đứt cuối mỗi nhóm; bỏ nút ở đầu trang." },
    ],
  },
  {
    version: "6.6.3",
    date: "2026-10-14",
    title: "Thêm tài khoản ngay trong danh sách",
    changes: [
      { kind: "improved", text: "Trên điện thoại, nút + nổi ở trang Tài khoản được thay bằng dòng “Thêm tài khoản” cuối nhóm Tài khoản chính, như “Thêm hũ”." },
    ],
  },
  {
    version: "6.6.2",
    date: "2026-10-14",
    title: "Hũ tiết kiệm gọn chữ hơn",
    changes: [
      { kind: "improved", text: "Nhóm “Đang dùng” đổi tên thành “Tài khoản chính” và nằm trên nhóm Hũ tiết kiệm." },
      { kind: "improved", text: "Ô Mục tiêu của hũ có lại gợi ý nhập nhanh số tiền." },
      { kind: "improved", text: "Đưa tiền vào hũ gọi là “nạp”: Nạp vào hũ, Mỗi tháng nên nạp, Cần nạp khoảng … mỗi tháng để đạt mục tiêu đúng hạn." },
    ],
  },
  {
    version: "6.6.1",
    date: "2026-10-14",
    title: "Kiểm thử hũ tiết kiệm",
    changes: [{ kind: "improved", text: "Thêm bài kiểm thử cho hũ tiết kiệm: tạo, sửa, bỏ vào, rút ra, đã mua (rẻ hơn, đắt hơn, vừa đủ) và xoá hũ." }],
  },
  {
    version: "6.6.0",
    date: "2026-10-14",
    title: "Hũ tiết kiệm",
    changes: [
      { kind: "new", text: "Hũ tiết kiệm trên trang Tài khoản: để dành cho một món như xe máy, điện thoại, ti vi, có mục tiêu và hạn." },
      { kind: "new", text: "Bỏ vào hũ, rút ra như chuyển khoản; có hạn thì app tính mỗi tháng nên bỏ bao nhiêu." },
      { kind: "new", text: "Đủ tiền thì bấm Đã mua: ghi khoản chi từ hũ, phần thừa chuyển về tài khoản, hũ sang Đã hoàn thành." },
    ],
  },
  {
    version: "6.5.2",
    date: "2026-10-14",
    title: "Dòng đang chạm phủ đều",
    changes: [
      { kind: "fixed", text: "Chạm vào một dòng trong danh sách, nền xám phủ lên cả đường kẻ phía trên lẫn phía dưới, không còn lệch một bên." },
    ],
  },
  {
    version: "6.5.1",
    date: "2026-10-14",
    title: "Trợ lý AI đổi tên thành Timi",
    changes: [
      { kind: "improved", text: "Trợ lý AI giờ mang tên Timi, cùng tên với app (trước là LiuLiu)." },
    ],
  },
  {
    version: "6.5.0",
    date: "2026-10-14",
    title: "Đăng nhập một chạm với Google",
    changes: [
      { kind: "new", text: "Ở trang chủ và trang đăng nhập, Google hiện gợi ý các tài khoản đang đăng nhập trên trình duyệt: chạm một tài khoản là vào app. Gợi ý chỉ hiện khi trình duyệt đã đăng nhập Google." },
    ],
  },
  {
    version: "6.4.9",
    date: "2026-10-14",
    title: "Trợ lý không còn khựng sau mỗi lần cập nhật",
    changes: [
      { kind: "fixed", text: "Sau mỗi lần cập nhật app, LiuLiu không còn lúc khựng vài giây hay phải chờ 10 giây: phần tính toán AI đã chuẩn bị được giữ lại thay vì làm lại từ đầu." },
    ],
  },
  {
    version: "6.4.8",
    date: "2026-10-14",
    title: "Trợ lý trả lời nhanh ngay sau khi máy chủ khởi động lại",
    changes: [
      { kind: "fixed", text: "Sau khi máy chủ khởi động lại, mỗi câu hỏi LiuLiu không còn phải chờ thêm khoảng 10 giây: model AI nội bộ được nạp sẵn ngay khi máy chủ chạy." },
    ],
  },
  {
    version: "6.4.7",
    date: "2026-10-13",
    title: "Nút AI rõ hơn ở giao diện tối",
    changes: [
      { kind: "improved", text: "Ở giao diện tối, icon trên nút AI cạnh thanh tab và nút “Hỏi AI” dùng xanh chanh đậm như logo, dễ nhìn trên nền trắng." },
    ],
  },
  {
    version: "6.4.6",
    date: "2026-10-13",
    title: "Thanh tab liền mạch",
    changes: [
      { kind: "fixed", text: "Thanh tab dưới không còn lộ vệt sáng ở bốn chỗ nối giữa cạnh thẳng và đầu bo tròn (giao diện sáng)." },
    ],
  },
  {
    version: "6.4.5",
    date: "2026-10-13",
    title: "Kiểm thử theo câu báo lỗi mới",
    changes: [{ kind: "fixed", text: "Bài kiểm thử giao dịch khớp với câu báo lỗi thời gian mới." }],
  },
  {
    version: "6.4.4",
    date: "2026-10-13",
    title: "Báo lỗi ngày giờ dễ hiểu hơn",
    changes: [
      { kind: "improved", text: "Chọn ngày giờ chưa tới giờ báo “Không thể chọn thời gian trong tương lai” (khoản nợ: “ngày trong tương lai”)." },
    ],
  },
  {
    version: "6.4.3",
    date: "2026-10-13",
    title: "Ô ngày giờ gọn gàng hơn",
    changes: [
      { kind: "fixed", text: "Viền ô chọn ngày và giờ không còn bị cắt ở hai bên khi đang chọn hoặc nhập sai." },
      { kind: "improved", text: "Trên máy tính, bấm vào bất kỳ chỗ nào của ô ngày hoặc giờ là mở bảng chọn." },
    ],
  },
  {
    version: "6.4.2",
    date: "2026-10-13",
    title: "Xoá giao dịch trong trang sửa",
    changes: [
      { kind: "improved", text: "Xoá giao dịch chuyển vào trang sửa: nút thùng rác cạnh nút Lưu, vẫn hoàn tác được trong 6 giây." },
    ],
  },
  {
    version: "6.4.1",
    date: "2026-10-13",
    title: "Nút xoá đặc nền",
    changes: [{ kind: "fixed", text: "Nút xoá tròn ở chân sheet có nền đặc, không còn nhìn xuyên thấy nội dung phía sau." }],
  },
  {
    version: "6.4.0",
    date: "2026-10-13",
    title: "Khoá và xoá tài khoản trong trang sửa",
    changes: [
      { kind: "improved", text: "Chi tiết tài khoản chỉ còn để xem; khoá và xoá tài khoản chuyển vào trang sửa (bút chì)." },
      { kind: "new", text: "“Ngừng sử dụng” đổi thành công tắc “Khoá tài khoản”: bật rồi bấm Lưu. Tắt rồi Lưu để mở khoá." },
      { kind: "improved", text: "Xoá tài khoản là nút thùng rác cạnh nút Lưu, như khi sửa hạng mục." },
    ],
  },
  {
    version: "6.3.4",
    date: "2026-10-13",
    title: "Nút ở chân sheet gọn hơn",
    changes: [
      { kind: "improved", text: "Nút ở chân sheet nằm thấp hơn, sát thanh vuốt của điện thoại, và nổi lên như các nút ở đầu sheet." },
      { kind: "improved", text: "Nội dung cuộn mờ dần xuống tận mép dưới sheet, không còn dải nền đặc dưới nút." },
    ],
  },
  {
    version: "6.3.3",
    date: "2026-10-13",
    title: "Logo rõ ở giao diện tối",
    changes: [
      { kind: "improved", text: "Ở giao diện tối, logo đổi sang ô trắng cột đen cho rõ, thay vì ô đen chìm vào nền" },
    ],
  },
  {
    version: "6.3.2",
    date: "2026-10-13",
    title: "Màn khởi động đồng bộ tên Timi",
    changes: [
      { kind: "fixed", text: "Màn khởi động viết tên Timi đúng kiểu chữ như các chỗ khác" },
      { kind: "fixed", text: "Thông báo \"Có gì mới\" nói rõ app đã đổi tên thành Timi và có địa chỉ mới" },
    ],
  },
  {
    version: "6.3.1",
    date: "2026-10-13",
    title: "Logo đúng bản đã chọn",
    changes: [
      { kind: "fixed", text: "Logo trả lại đúng hình bản demo: cột xanh chanh thấp hơn cột giữa, ngôi sao to hơn" },
    ],
  },
  {
    version: "6.3.0",
    date: "2026-10-13",
    title: "Finance Tracker giờ là Timi",
    changes: [
      { kind: "new", text: "App có tên mới là Timi, dễ đọc dễ nhớ hơn, và địa chỉ mới timi.nnqlab.dev (địa chỉ cũ tự chuyển sang)" },
      { kind: "new", text: "Logo mới: ba cột tăng dần, cột cuối xanh chanh có ngôi sao, trên icon app, màn khởi động, thông báo và khi chia sẻ link" },
      { kind: "improved", text: "Tổng quan mở đầu bằng logo và lời chào; cuối Cài đặt có logo và số phiên bản" },
      { kind: "improved", text: "Tên Timi viết bằng đúng font của app" },
    ],
  },
  {
    version: "6.2.0",
    date: "2026-10-13",
    title: "Logo Timi khắp app",
    changes: [
      { kind: "new", text: "Tổng quan mở đầu bằng logo Timi và lời chào, như một app trên điện thoại" },
      { kind: "new", text: "Cuối Cài đặt có logo và số phiên bản" },
      { kind: "improved", text: "Thanh bên trên máy tính, ảnh khi chia sẻ link và thông báo đẩy dùng logo mới" },
    ],
  },
  {
    version: "6.1.2",
    date: "2026-10-13",
    title: "Ngôi sao rõ hơn trên nền sáng",
    changes: [
      { kind: "improved", text: "Ngôi sao trong chữ timi đậm hơn ở giao diện sáng cho dễ thấy" },
    ],
  },
  {
    version: "6.1.1",
    date: "2026-10-13",
    title: "Chữ timi theo logo",
    changes: [
      { kind: "improved", text: "Trang chủ và màn đăng nhập viết chữ \"timi\" đúng kiểu logo, ngôi sao làm dấu chấm chữ i" },
    ],
  },
  {
    version: "6.1.0",
    date: "2026-10-13",
    title: "Logo mới của Timi",
    changes: [
      { kind: "new", text: "Logo mới: chữ t với ngôi sao xanh chanh, trên icon app, màn khởi động và trang chủ" },
    ],
  },
  {
    version: "6.0.0",
    date: "2026-10-13",
    title: "Finance Tracker giờ là Timi",
    changes: [
      { kind: "new", text: "App có tên mới: Timi, dễ đọc dễ nhớ hơn" },
      { kind: "new", text: "Địa chỉ mới timi.nnqlab.dev; địa chỉ cũ tự chuyển sang" },
      { kind: "improved", text: "Màn khởi động trên iPhone, iPad dùng đúng font và tên mới" },
    ],
  },
  {
    version: "5.7.0",
    date: "2026-10-12",
    title: "Thông báo thật",
    changes: [
      { kind: "new", text: "Chuông thông báo dùng dữ liệu thật: khoản nợ sắp đến hạn hay quá hạn, hôm qua chưa ghi chi tiêu, phần thưởng nhiệm vụ chờ nhận, sắp hết lượt AI, gói Pro sắp hết hạn, tài khoản đang âm" },
      { kind: "new", text: "Thông báo \"Có gì mới\" khi app có tính năng mới, chạm để xem các thay đổi" },
      { kind: "improved", text: "Đã đọc trên máy này thì máy khác cũng biết; chạm thông báo mở đúng khoản nợ, tài khoản hay màn liên quan" },
    ],
  },
  {
    version: "5.6.5",
    date: "2026-10-12",
    title: "Gọn đầu trang Giao dịch",
    changes: [
      { kind: "improved", text: "Bỏ nút Nhập bằng AI ở đầu trang Giao dịch: LiuLiu đã có ở thanh tab (điện thoại) và nút Hỏi AI (máy tính)" },
    ],
  },
  {
    version: "5.6.4",
    date: "2026-10-12",
    title: "Không tính vào báo cáo",
    changes: [
      { kind: "improved", text: "Đổi cách gọi: công tắc \"Không tính vào báo cáo\" như MISA, nhãn ngắn \"Ngoài báo cáo\", bộ lọc \"Chỉ khoản ngoài báo cáo\", thẻ tổng \"1 tài khoản ngoài báo cáo\"" },
    ],
  },
  {
    version: "5.6.3",
    date: "2026-10-12",
    title: "Tài khoản không tính vẫn là đang dùng",
    changes: [
      { kind: "improved", text: "Tài khoản không tính vào thống kê nằm trong nhóm Đang dùng, ghi \"Không tính\" và số dư xám, thay vì một nhóm riêng" },
      { kind: "improved", text: "Trên máy tính, tài khoản ngừng sử dụng hiện thành thẻ cùng cỡ, vẫn thu gọn được" },
      { kind: "fixed", text: "Bộ lọc ở trang Giao dịch trên máy tính không còn nhảy xuống khi nút Đặt lại hiện ra" },
    ],
  },
  {
    version: "5.6.2",
    date: "2026-10-12",
    title: "LiuLiu xưng hô bình thường, láo thì láo lại",
    changes: [
      { kind: "improved", text: "LiuLiu xưng tui, gọi bạn; ai xưng mày tao hay thái độ thì LiuLiu đáp lại đúng kiểu đó (không chửi tục)" },
      { kind: "fixed", text: "Câu trả lời trò chuyện bị cụt giữa chừng được hỏi lại tự động" },
    ],
  },
  {
    version: "5.6.1",
    date: "2026-10-12",
    title: "LiuLiu lầy hơn, ghi giao dịch chắc hơn",
    changes: [
      { kind: "improved", text: "LiuLiu đổi giọng Gen Z: xưng tui, gọi ní, hay cà khịa chuyện cháy ví; gặp chuyện buồn thật thì thôi đùa" },
      { kind: "fixed", text: "Khoản nói cho tối nay hay giờ sắp tới được ghi vào giờ hiện tại, không còn lưu không được mà không rõ lý do" },
      { kind: "fixed", text: "Một khoản lưu không được thì không còn để lại hạng mục mới vừa tạo" },
      { kind: "fixed", text: "Chuyển khoản không nói tài khoản nguồn không còn bị trùng tài khoản hai bên" },
      { kind: "fixed", text: "Đổi khoản chi thành khoản thu trong form thì bỏ gợi ý hạng mục chi cũ" },
      { kind: "fixed", text: "Hoàn tác chỉ thu hồi hạng mục mới khi chưa có giao dịch nào khác dùng nó" },
      { kind: "fixed", text: "Thẻ ghi giao dịch giữ nguyên chỗ đã sửa và trạng thái đã lưu khi hiện lại; câu nói dài hơn (tối đa 600 ký tự)" },
    ],
  },
  {
    version: "5.6.0",
    date: "2026-10-12",
    title: "LiuLiu ghi nhiều giao dịch một lần",
    changes: [
      { kind: "new", text: "Nói hoặc gõ nhiều khoản trong một câu (tối đa 10), LiuLiu hiện thẻ xem trước để kiểm tra rồi lưu cả cùng lúc, chỉ tốn một lượt AI" },
      { kind: "new", text: "Chạm một dòng để sửa bằng form giao dịch quen thuộc, × để bỏ, Hoàn tác ngay sau khi lưu" },
      { kind: "new", text: "Khi chưa có hạng mục hợp, LiuLiu gợi ý hạng mục mới kèm icon, đánh dấu Mới, tự tạo khi lưu; đổi sang hạng mục có sẵn bằng một chạm" },
      { kind: "new", text: "Hiểu phí chuyển khoản và \"không tính\", điền tài khoản dùng gần nhất khi không nói" },
      { kind: "improved", text: "Nút Nhập bằng AI và nhiệm vụ AI mở LiuLiu; trợ lý cũ ở trang Giao dịch đã bỏ" },
    ],
  },
  {
    version: "5.5.1",
    date: "2026-10-12",
    title: "Số liệu khớp nhau ở mọi màn",
    changes: [
      { kind: "fixed", text: "Lọc theo tài khoản hay số tiền ở trang Giao dịch tính phí chuyển khoản theo đúng tài khoản trả phí và số tiền của phí" },
      { kind: "fixed", text: "Tổng từng ngày giữ nguyên khi chọn Thu, Chi, Chuyển khoản hay Vay nợ; số giao dịch trên ô Thu / Chi khớp với số tiền" },
      { kind: "fixed", text: "Sheet một ngày ở lịch Tổng quan liệt kê cả lần trả nợ, gọi là Thu / Chi như trang Giao dịch" },
      { kind: "fixed", text: "Màn Vay nợ không còn đổi số dư của tài khoản ngừng sử dụng khi xoá hay chuyển lần trả nợ, khoản vay" },
      { kind: "fixed", text: "Lãi của khoản vay từ tài khoản không tính cũng không tính vào thu chi" },
      { kind: "improved", text: "Thẻ tài sản ròng ghi tài khoản chưa tính; LiuLiu hiểu phí chuyển khoản, tiền lãi vay và điều chỉnh số dư" },
      { kind: "improved", text: "Tải lãi vay nhanh hơn, chỉ đọc các khoản nợ cần đến" },
    ],
  },
  {
    version: "5.5.0",
    date: "2026-10-12",
    title: "Số dư sau từng giao dịch",
    changes: [
      { kind: "new", text: "Chi tiết tài khoản ghi số dư còn lại sau từng giao dịch gần đây, như sao kê ngân hàng" },
      { kind: "new", text: "Quản trị có nút Kiểm tra số dư: tìm tài khoản có số dư không khớp với số dư ban đầu cộng các giao dịch" },
      { kind: "improved", text: "Form giao dịch nhắc khi ngày giao dịch trước ngày mở tài khoản" },
      { kind: "fixed", text: "Không chọn được giờ sau bây giờ cho giao dịch hôm nay" },
      { kind: "fixed", text: "Xoá giao dịch khi mạng chập chờn không còn báo lỗi \"không tồn tại\"; lưu lại sau khi mất phản hồi không báo lỗi nhầm" },
      { kind: "fixed", text: "Lưu, sửa, xoá giao dịch tự thử lại khi hai thiết bị thao tác cùng lúc" },
    ],
  },
  {
    version: "5.4.0",
    date: "2026-10-12",
    title: "Tài khoản ngừng sử dụng giữ nguyên số dư",
    changes: [
      { kind: "improved", text: "Tài khoản ngừng sử dụng giữ nguyên số dư: không đổi số tiền hay xoá giao dịch của nó cho đến khi dùng lại (vẫn sửa được ghi chú, hạng mục, ngày)" },
      { kind: "improved", text: "Trang Giao dịch gọi là Thu / Chi, phân biệt với tiền vào ra của từng tài khoản" },
      { kind: "fixed", text: "LiuLiu không còn tính chuyển khoản giữa các tài khoản của bạn là cả tiền vào lẫn tiền ra, và bỏ tài khoản không tính khi hỏi tiền vào ra" },
    ],
  },
  {
    version: "5.3.0",
    date: "2026-10-12",
    title: "Tiền lãi vay vào thu chi",
    changes: [
      { kind: "new", text: "Phần lãi của mỗi lần trả nợ tính là khoản thu (cho vay) hoặc khoản chi (đi vay) ở Tổng quan, trang Giao dịch, biểu đồ và LiuLiu; tiền gốc vẫn không tính" },
      { kind: "new", text: "Biểu đồ phân bổ có mục \"Tiền lãi vay\"" },
      { kind: "fixed", text: "Khoản vay từ tài khoản không tính không còn cộng vào tài sản ròng" },
    ],
  },
  {
    version: "5.2.0",
    date: "2026-10-12",
    title: "Điều chỉnh số dư và xoá tài khoản an toàn",
    changes: [
      { kind: "new", text: "Sửa số dư tài khoản sẽ ghi một giao dịch \"Điều chỉnh số dư\" cho phần chênh lệch, không tính vào thống kê trừ khi bạn bật lên; xoá giao dịch đó để hoàn tác" },
      { kind: "improved", text: "Số dư ban đầu của tài khoản giữ nguyên khi sửa số dư" },
      { kind: "fixed", text: "Tài khoản đã có chuyển khoản hoặc vay nợ không xoá được nữa (trước đây xoá làm sai số dư tài khoản khác và khoản nợ), chỉ ngừng sử dụng" },
      { kind: "fixed", text: "Chú thích \"Ngừng sử dụng\" nói đúng là số dư vẫn tính vào tổng" },
    ],
  },
  {
    version: "5.1.1",
    date: "2026-10-12",
    title: "Phí chuyển khoản tính đúng ở mọi nơi",
    changes: [
      { kind: "fixed", text: "Phí chuyển khoản tính là chi tiêu ở cả Tổng quan, lịch, biểu đồ phân bổ và LiuLiu, không chỉ ở trang Giao dịch" },
      { kind: "fixed", text: "Phí trả từ tài khoản không tính không còn bị cộng vào chi tiêu" },
      { kind: "fixed", text: "LiuLiu tính cả tài khoản ngừng sử dụng còn tiền khi trả lời tổng số dư" },
      { kind: "improved", text: "Biểu đồ phân bổ có mục riêng \"Phí chuyển khoản\"" },
    ],
  },
  {
    version: "5.1.0",
    date: "2026-10-12",
    title: "Tài khoản không tính vào thống kê",
    changes: [
      { kind: "new", text: "Không tính một tài khoản vào thống kê: số dư không cộng vào tổng và tài sản ròng, thu chi của nó không vào thống kê" },
      { kind: "new", text: "Tài khoản không tính nằm trong nhóm riêng ở trang Tài khoản, thẻ tổng ghi số tiền chưa tính" },
      { kind: "improved", text: "Giao dịch của tài khoản không tính tự xám đi, công tắc trong chi tiết được giữ bật" },
      { kind: "improved", text: "LiuLiu bỏ tài khoản không tính khỏi tổng số dư và tài sản ròng, và nói rõ đã bỏ tài khoản nào" },
      { kind: "improved", text: "Tài khoản đã lưu trữ vẫn được cộng vào tổng số dư" },
    ],
  },
  {
    version: "5.0.0",
    date: "2026-10-12",
    title: "Trợ lý LiuLiu và giao diện mới",
    changes: [
      { kind: "new", text: "Trợ lý LiuLiu trên mọi trang: hỏi về thu chi, tài khoản, nợ, tài sản ròng bằng chữ hoặc giọng nói" },
      { kind: "new", text: "LiuLiu trò chuyện, chào hỏi và cho biết còn bao nhiêu lượt AI" },
      { kind: "new", text: "Không tính một giao dịch vào thống kê" },
      { kind: "new", text: "Nhận dạng giọng nói chạy trên máy chủ riêng, nghe đúng tên ngân hàng và ví" },
      { kind: "new", text: "Gói Pro thanh toán qua payOS, nhiệm vụ nhận thêm lượt AI" },
      { kind: "new", text: "Lịch sử phiên bản trong mục Quản trị" },
      { kind: "improved", text: "Dữ liệu chuyển sang PostgreSQL" },
      { kind: "improved", text: "Hệ thống thiết kế mới: chữ Manrope, màu thu chi mới, thanh tab kiểu iOS 26" },
      { kind: "improved", text: "Trang đăng nhập, trang giới thiệu và hướng dẫn sử dụng làm lại" },
      { kind: "improved", text: "Biểu tượng nhiệm vụ dùng màu xám như trang Cài đặt" },
      { kind: "fixed", text: "Nhiều lỗi PWA trên iOS: chạm bị mất, màu thanh trạng thái, sheet đóng nhầm" },
    ],
  },
  {
    version: "4.0.0",
    date: "2026-10-04",
    title: "Lịch dòng tiền và lãi khoản vay",
    changes: [
      { kind: "new", text: "Mở từng ngày trên lịch dòng tiền ở Tổng quan" },
      { kind: "new", text: "Lãi của khoản vay, gốc cộng lãi đến ngày hạn" },
      { kind: "new", text: "Ngày giờ mở của tài khoản" },
      { kind: "improved", text: "Form nợ chia tab, báo lỗi dưới từng ô" },
      { kind: "improved", text: "Cài đặt gọn hơn, ít nhóm và ít chữ hơn" },
      { kind: "fixed", text: "Ô chọn tài khoản hoặc người liên hệ trống không còn mở hộp lạ" },
    ],
  },
  {
    version: "3.1.2",
    date: "2026-10-01",
    title: "Thiết kế lại các trang cho điện thoại",
    changes: [
      { kind: "improved", text: "Tổng quan gọn, ưu tiên điện thoại" },
      { kind: "improved", text: "Trang nợ dạng danh sách thẻ với sheet chi tiết" },
      { kind: "improved", text: "Nút thêm giao dịch nổi, tài khoản lưu trữ gom nhóm" },
      { kind: "improved", text: "Trang giới thiệu mới có chuyển động" },
    ],
  },
  {
    version: "3.1.1",
    date: "2026-10-01",
    title: "Nhắc ghi chi tiêu hằng ngày",
    changes: [
      { kind: "new", text: "Nhắc ghi chi tiêu theo giờ đã chọn, gửi từ worker riêng" },
    ],
  },
  {
    version: "3.1.0",
    date: "2026-09-30",
    title: "Thông báo đẩy",
    changes: [
      { kind: "new", text: "Thông báo đẩy và trang Cài đặt" },
      { kind: "new", text: "Màn hình chờ khi mở app đã cài" },
      { kind: "fixed", text: "Thanh trạng thái và cuộn quá đà trên PWA" },
    ],
  },
  {
    version: "3.0.5",
    date: "2026-09-29",
    title: "Thanh điều hướng nhanh hơn",
    changes: [
      { kind: "improved", text: "Hạng mục và giao dịch gọn hơn" },
      { kind: "fixed", text: "Thanh điều hướng trên điện thoại chậm" },
      { kind: "fixed", text: "Màu thanh bên ở theme tối" },
    ],
  },
  {
    version: "3.0.3",
    date: "2026-09-29",
    title: "Sửa lỗi PWA trên iOS",
    changes: [
      { kind: "fixed", text: "PWA trên iOS và ảnh xem trước khi chia sẻ" },
    ],
  },
  {
    version: "3.0.0",
    date: "2026-09-29",
    title: "Cài được như một ứng dụng",
    changes: [
      { kind: "new", text: "Cài app lên màn hình chính (PWA)" },
      { kind: "new", text: "Trang giới thiệu công khai" },
      { kind: "improved", text: "Trang tài khoản và giao diện chung làm lại" },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-09-23",
    title: "Giao dịch và sổ nợ",
    changes: [
      { kind: "new", text: "Trang nợ" },
      { kind: "new", text: "Sửa giao dịch" },
      { kind: "improved", text: "Danh sách và sheet giao dịch mới" },
    ],
  },
  {
    version: "1.0.3",
    date: "2026-09-14",
    title: "Dọn dẹp",
    changes: [{ kind: "fixed", text: "Sửa lỗi nhỏ" }],
  },
  {
    version: "1.0.2",
    date: "2026-09-14",
    title: "Bản đầu tiên",
    changes: [{ kind: "new", text: "Ghi thu chi, tài khoản và hạng mục" }],
  },
]

/** How far a version moved from the one before it. */
export function releaseLevel(index: number): ReleaseLevel {
  const previous = releases[index + 1]
  if (!previous) return "major"
  const [major, minor] = releases[index].version.split(".").map(Number)
  const [prevMajor, prevMinor] = previous.version.split(".").map(Number)
  if (major !== prevMajor) return "major"
  if (minor !== prevMinor) return "minor"
  return "patch"
}
