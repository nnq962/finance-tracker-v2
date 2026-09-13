import type { CategoryGroup } from "../_types/category"

export const categoryGroups: CategoryGroup[] = [
  {
    id: "food",
    type: "expense",
    name: "Ăn uống",
    iconName: "utensils",
    colorName: "orange",
    items: [
      { id: "breakfast", name: "Ăn sáng", iconName: "coffee", colorName: "orange" },
      { id: "lunch", name: "Ăn trưa", iconName: "soup", colorName: "orange" },
      { id: "dinner", name: "Ăn tối", iconName: "pizza", colorName: "orange" },
    ],
  },
  {
    id: "housing",
    type: "expense",
    name: "Nhà cửa",
    iconName: "house",
    colorName: "blue",
    items: [
      { id: "rent", name: "Tiền thuê nhà", iconName: "building", colorName: "blue" },
      { id: "electricity", name: "Điện nước", iconName: "lightbulb", colorName: "blue" },
      { id: "internet", name: "Internet", iconName: "wifi", colorName: "blue" },
    ],
  },
  {
    id: "transport",
    type: "expense",
    name: "Đi lại",
    iconName: "car",
    colorName: "cyan",
    items: [
      { id: "public-transport", name: "Phương tiện công cộng", iconName: "bus", colorName: "cyan" },
      { id: "ride-hailing", name: "Taxi và xe công nghệ", iconName: "smartphone", colorName: "cyan" },
    ],
  },
  {
    id: "shopping",
    type: "expense",
    name: "Mua sắm",
    iconName: "shopping-bag",
    colorName: "violet",
    items: [
      { id: "clothing", name: "Quần áo", iconName: "shirt", colorName: "violet" },
      { id: "technology", name: "Đồ công nghệ", iconName: "laptop", colorName: "violet" },
      { id: "household", name: "Đồ gia dụng", iconName: "package", colorName: "violet" },
    ],
  },
  {
    id: "salary",
    type: "income",
    name: "Lương",
    iconName: "banknote",
    colorName: "emerald",
    items: [
      { id: "monthly-salary", name: "Lương hàng tháng", iconName: "receipt", colorName: "emerald" },
      { id: "bonus", name: "Thưởng", iconName: "coins", colorName: "emerald" },
    ],
  },
  {
    id: "business",
    type: "income",
    name: "Kinh doanh",
    iconName: "briefcase",
    colorName: "cyan",
    items: [
      { id: "sales", name: "Bán hàng", iconName: "shopping-bag", colorName: "cyan" },
      { id: "freelance", name: "Làm việc tự do", iconName: "hand-coins", colorName: "cyan" },
    ],
  },
  {
    id: "investment",
    type: "income",
    name: "Đầu tư",
    iconName: "chart",
    colorName: "violet",
    items: [
      { id: "interest", name: "Tiền lãi", iconName: "coins", colorName: "violet" },
      { id: "dividend", name: "Cổ tức", iconName: "banknote", colorName: "violet" },
    ],
  },
  {
    id: "gift",
    type: "income",
    name: "Quà tặng",
    iconName: "gift",
    colorName: "pink",
    items: [
      { id: "family-gift", name: "Từ gia đình", iconName: "gift", colorName: "pink" },
      { id: "other-income", name: "Khoản thu khác", iconName: "banknote", colorName: "pink" },
    ],
  },
]
