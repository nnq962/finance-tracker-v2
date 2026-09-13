import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"

export type CategoryType = "expense" | "income"

export type CategoryItem = {
  id: string
  name: string
  iconName: CategoryIconName
  colorName: CategoryColorName
}

export type CategoryGroup = {
  id: string
  type: CategoryType
  name: string
  iconName: CategoryIconName
  colorName: CategoryColorName
  items: CategoryItem[]
}
