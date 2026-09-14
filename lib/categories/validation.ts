import "server-only"

import { categoryColorOptions } from "@/lib/categories/category-colors"
import type {
  CategoryFormValues,
  CategoryItemFormValues,
  CategoryType,
} from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

const categoryTypes = new Set<CategoryType>(["expense", "income"])
const categoryColors = new Set<string>(
  categoryColorOptions.map((option) => option.name),
)

export class CategoryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CategoryValidationError"
  }
}

export function parseCategoryType(value: unknown): CategoryType {
  if (typeof value !== "string" || !categoryTypes.has(value as CategoryType)) {
    throw new CategoryValidationError("Loại hạng mục không hợp lệ.")
  }

  return value as CategoryType
}

export function parseCategoryFormValues(
  values: unknown,
): CategoryFormValues {
  if (!values || typeof values !== "object") {
    throw new CategoryValidationError("Thông tin hạng mục không hợp lệ.")
  }

  const candidate = values as Record<string, unknown>
  const name = typeof candidate.name === "string" ? candidate.name.trim() : ""

  if (!name) {
    throw new CategoryValidationError("Tên hạng mục là bắt buộc.")
  }

  if (name.length > 80) {
    throw new CategoryValidationError(
      "Tên hạng mục không được vượt quá 80 ký tự.",
    )
  }

  if (
    typeof candidate.colorName !== "string" ||
    !categoryColors.has(candidate.colorName)
  ) {
    throw new CategoryValidationError("Màu sắc không hợp lệ.")
  }

  if (
    typeof candidate.iconName !== "string" ||
    !(candidate.iconName in categoryIconRegistry)
  ) {
    throw new CategoryValidationError("Biểu tượng không hợp lệ.")
  }

  return {
    name,
    colorName: candidate.colorName as CategoryFormValues["colorName"],
    iconName: candidate.iconName as CategoryFormValues["iconName"],
  }
}

export function parseCategoryItemFormValues(
  values: unknown,
): CategoryItemFormValues {
  if (!values || typeof values !== "object") {
    throw new CategoryValidationError("Thông tin hạng mục không hợp lệ.")
  }

  const candidate = values as Record<string, unknown>
  const name = typeof candidate.name === "string" ? candidate.name.trim() : ""

  if (!name) {
    throw new CategoryValidationError("Tên hạng mục là bắt buộc.")
  }

  if (name.length > 80) {
    throw new CategoryValidationError(
      "Tên hạng mục không được vượt quá 80 ký tự.",
    )
  }

  if (
    typeof candidate.iconName !== "string" ||
    !(candidate.iconName in categoryIconRegistry)
  ) {
    throw new CategoryValidationError("Biểu tượng không hợp lệ.")
  }

  return {
    name,
    iconName: candidate.iconName as CategoryItemFormValues["iconName"],
  }
}

export function assertCategoryId(id: unknown, label = "Hạng mục") {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,1500}$/.test(id)) {
    throw new CategoryValidationError(`${label} không hợp lệ.`)
  }
}
