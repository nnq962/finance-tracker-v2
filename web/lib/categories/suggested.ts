import "server-only"

import { categoryColorOptions } from "@/lib/categories/category-colors"
import { createCategoryGroup, createCategoryItem, getCategoryGroups } from "@/lib/categories/repository"
import type { CategoryType } from "@/lib/categories/types"
import { CategoryValidationError, parseCategoryFormValues, parseCategoryItemFormValues } from "@/lib/categories/validation"

/** Lower case without Vietnamese marks, so "Ăn vặt" is found as "an vat". */
const plain = (text: string) =>
  text.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").trim()

/**
 * Makes a category the AI suggested: in one of the user's groups, or in a new
 * group with a colour not yet used for that kind. The item takes the icon
 * suggested with it, else its group's; both can be changed later. One the user already has under that name
 * (in any group of the kind) is used instead. Says what it made, so it can
 * be taken back.
 */
export async function createSuggestedCategory(
  userId: string,
  suggestion: { type: CategoryType; name: string; groupId?: string; groupName: string; iconName?: string },
): Promise<{ itemId: string; createdItem: boolean; createdGroupId?: string }> {
  const groups = (await getCategoryGroups(userId)).filter((group) => group.type === suggestion.type)
  const existing = groups.flatMap((group) => group.items).find((item) => plain(item.name) === plain(suggestion.name))
  if (existing) return { itemId: existing.id, createdItem: false }

  let createdGroupId: string | undefined
  const group = await (async () => {
    if (suggestion.groupId !== undefined) {
      const found = groups.find((item) => item.id === suggestion.groupId)
      if (!found) throw new CategoryValidationError("Nhóm hạng mục không tồn tại.")
      return found
    }
    const named = groups.find((item) => plain(item.name) === plain(suggestion.groupName))
    if (named) return named
    const usedColors = new Set(groups.map((item) => item.colorName))
    const values = parseCategoryFormValues({
      name: suggestion.groupName,
      colorName: categoryColorOptions.find((option) => !usedColors.has(option.name))?.name ?? "blue",
      iconName: suggestion.iconName ?? "receipt",
    })
    createdGroupId = await createCategoryGroup(userId, suggestion.type, values)
    return { id: createdGroupId, ...values }
  })()

  const itemId = await createCategoryItem(
    userId,
    group.id,
    parseCategoryItemFormValues({ name: suggestion.name, iconName: suggestion.iconName ?? group.iconName }),
  )
  return { itemId, createdItem: true, ...(createdGroupId ? { createdGroupId } : {}) }
}
