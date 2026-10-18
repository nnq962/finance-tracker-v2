import type { CategoryIconName } from "./category-icon-registry"

/**
 * Words people use for what they save for or spend on, beyond the icons' own
 * names (2026-10-18: a jar called "Du lịch Nhật" found no icon, as no icon
 * is named "du lịch"). Each line: the words (written with accents; typed
 * without, they still match), then the icons they bring up, best first.
 * Read by suggestIcons (components/forms/icon-picker.tsx), for jars and
 * categories alike.
 */
export const iconKeywords: [string[], CategoryIconName[]][] = [
  [["du lịch", "đi chơi", "phượt", "chuyến đi", "nghỉ mát", "nước ngoài", "nhật bản", "hàn quốc", "thái lan", "châu âu", "đà lạt", "sapa", "phú quốc"], ["plane", "luggage", "umbrella"]],
  [["biển", "đảo"], ["sailboat", "umbrella"]],
  [["cưới", "đám cưới", "cầu hôn", "nhẫn", "hẹn hò", "người yêu"], ["heart-basic", "party", "gift"]],
  [["học", "học phí", "đại học", "du học", "khoá học", "học thêm", "luyện thi"], ["graduation", "school", "book-check"]],
  [["tiếng anh", "ielts", "toeic", "ngoại ngữ"], ["languages", "graduation"]],
  [["mua nhà", "căn hộ", "chung cư", "đất", "nhà riêng"], ["house", "building", "key"]],
  [["nội thất", "sửa nhà", "trang trí"], ["sofa", "paint-roller", "hammer"]],
  [["xe máy", "xe ga", "honda", "yamaha", "vision", "sh"], ["motorbike"]],
  [["ô tô", "xe hơi", "oto"], ["car"]],
  [["điện thoại", "iphone", "samsung"], ["smartphone"]],
  [["laptop", "macbook", "máy tính", "pc"], ["laptop", "devices"]],
  [["ipad", "máy tính bảng", "tai nghe", "airpods", "đồng hồ", "máy ảnh", "công nghệ"], ["devices"]],
  [["con", "em bé", "sinh con", "bỉm", "sữa bột"], ["baby"]],
  [["thú cưng", "chó", "mèo", "pet"], ["paw", "dog", "cat"]],
  [["khám", "chữa bệnh", "phẫu thuật", "răng", "nha khoa", "bảo hiểm", "sức khoẻ", "sức khỏe"], ["stethoscope", "hospital", "heart"]],
  [["khẩn cấp", "dự phòng", "quỹ"], ["vault", "piggy-bank"]],
  [["đầu tư", "chứng khoán", "cổ phiếu", "crypto"], ["chart", "trending-up"]],
  [["vàng", "trang sức"], ["coins", "crown"]],
  [["tết", "lì xì"], ["gift", "party"]],
  [["quà", "sinh nhật"], ["gift", "cake-basic"]],
  [["gym", "tập", "chạy bộ", "yoga", "bơi"], ["dumbbell", "activity"]],
  [["game", "ps5", "switch", "máy chơi game"], ["gamepad"]],
  [["concert", "vé", "show", "ca nhạc"], ["ticket", "music"]],
  [["từ thiện", "quyên góp"], ["hand-heart"]],
  [["bố mẹ", "gia đình", "ông bà"], ["users", "heart-handshake"]],
  [["kính", "mắt kính"], ["glasses"]],
  [["sách", "đọc"], ["book", "library"]],
]
