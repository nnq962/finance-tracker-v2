import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"

export type CategoryType = "expense" | "income"

export type CategoryStatus = "active" | "archived"

export type CategoryFormValues = {
  name: string
  colorName: CategoryColorName
  iconName: CategoryIconName
}

export type CategoryItemFormValues = Pick<
  CategoryFormValues,
  "name" | "iconName"
>

export type CategoryItem = CategoryFormValues & {
  id: string
  groupId: string
  type: CategoryType
}

export type CategoryGroup = CategoryFormValues & {
  id: string
  type: CategoryType
  items: CategoryItem[]
}

export type CategoryActionResult =
  | { success: true }
  | { success: false; error: string }
