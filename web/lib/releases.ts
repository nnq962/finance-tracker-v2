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
