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
