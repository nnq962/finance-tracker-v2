import "server-only"

import type { CategoryGroup, CategoryItem } from "@/lib/categories/types"

type DefaultCategoryGroup = Omit<CategoryGroup, "items"> & {
  items: Array<Omit<CategoryItem, "colorName">>
}

export const defaultCategoryGroups: DefaultCategoryGroup[] = [
  {
    id: "food",
    type: "expense",
    name: "Ăn uống",
    iconName: "utensils",
    colorName: "orange",
    items: [
      { id: "breakfast", groupId: "food", type: "expense", name: "Ăn sáng", iconName: "coffee" },
      { id: "lunch", groupId: "food", type: "expense", name: "Ăn trưa", iconName: "soup" },
      { id: "dinner", groupId: "food", type: "expense", name: "Ăn tối", iconName: "pizza" },
    ],
  },
  {
    id: "housing",
    type: "expense",
    name: "Nhà cửa",
    iconName: "house",
    colorName: "blue",
    items: [
      { id: "rent", groupId: "housing", type: "expense", name: "Tiền thuê nhà", iconName: "building" },
      { id: "electricity", groupId: "housing", type: "expense", name: "Điện nước", iconName: "lightbulb" },
      { id: "internet", groupId: "housing", type: "expense", name: "Internet", iconName: "wifi" },
    ],
  },
  {
    id: "transport",
    type: "expense",
    name: "Đi lại",
    iconName: "car",
    colorName: "cyan",
    items: [
      { id: "public-transport", groupId: "transport", type: "expense", name: "Phương tiện công cộng", iconName: "bus" },
      { id: "ride-hailing", groupId: "transport", type: "expense", name: "Taxi và xe công nghệ", iconName: "smartphone" },
    ],
  },
  {
    id: "shopping",
    type: "expense",
    name: "Mua sắm",
    iconName: "shopping-bag",
    colorName: "violet",
    items: [
      { id: "clothing", groupId: "shopping", type: "expense", name: "Quần áo", iconName: "shirt" },
      { id: "technology", groupId: "shopping", type: "expense", name: "Đồ công nghệ", iconName: "laptop" },
      { id: "household", groupId: "shopping", type: "expense", name: "Đồ gia dụng", iconName: "package" },
    ],
  },
  {
    id: "salary",
    type: "income",
    name: "Lương",
    iconName: "banknote",
    colorName: "emerald",
    items: [
      { id: "monthly-salary", groupId: "salary", type: "income", name: "Lương hàng tháng", iconName: "receipt" },
      { id: "bonus", groupId: "salary", type: "income", name: "Thưởng", iconName: "coins" },
    ],
  },
  {
    id: "business",
    type: "income",
    name: "Kinh doanh",
    iconName: "briefcase",
    colorName: "cyan",
    items: [
      { id: "sales", groupId: "business", type: "income", name: "Bán hàng", iconName: "shopping-bag" },
      { id: "freelance", groupId: "business", type: "income", name: "Làm việc tự do", iconName: "hand-coins" },
    ],
  },
  {
    id: "investment",
    type: "income",
    name: "Đầu tư",
    iconName: "chart",
    colorName: "violet",
    items: [
      { id: "interest", groupId: "investment", type: "income", name: "Tiền lãi", iconName: "coins" },
      { id: "dividend", groupId: "investment", type: "income", name: "Cổ tức", iconName: "banknote" },
    ],
  },
  {
    id: "gift",
    type: "income",
    name: "Quà tặng",
    iconName: "gift",
    colorName: "pink",
    items: [
      { id: "family-gift", groupId: "gift", type: "income", name: "Từ gia đình", iconName: "gift" },
      { id: "other-income", groupId: "gift", type: "income", name: "Khoản thu khác", iconName: "banknote" },
    ],
  },
]
