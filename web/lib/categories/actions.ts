"use server"

import { revalidatePath, updateTag } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { categoryGroupsCacheTag } from "@/lib/cache-tags"
import { categoryColorOptions } from "@/lib/categories/category-colors"
import {
  archiveCategoryGroup,
  archiveCategoryItem,
  createCategoryGroup,
  createCategoryItem,
  getCategoryGroups,
  updateCategoryGroup,
  updateCategoryItem,
} from "@/lib/categories/repository"
import type {
  CategoryActionResult,
  CategoryFormValues,
  CategoryItemFormValues,
} from "@/lib/categories/types"
import {
  assertCategoryId,
  CategoryValidationError,
  parseCategoryFormValues,
  parseCategoryItemFormValues,
  parseCategoryName,
  parseCategoryType,
} from "@/lib/categories/validation"

function failure(error: unknown): { success: false; error: string } {
  if (!(error instanceof CategoryValidationError)) {
    console.error("Category action failed", error)
  }

  return {
    success: false,
    error:
      error instanceof CategoryValidationError
        ? error.message
        : "Không thể lưu thay đổi. Vui lòng thử lại.",
  }
}

function revalidateCategoryData(userId: string) {
  updateTag(categoryGroupsCacheTag(userId))
  revalidatePath("/budget")
  revalidatePath("/transactions")
  revalidatePath("/settings")
  // The category sheet also opens from the overview's getting-started card.
  revalidatePath("/overview")
}

export async function createCategoryGroupAction(
  type: unknown,
  values: CategoryFormValues,
): Promise<CategoryActionResult> {
  const user = await requireSession()

  try {
    await createCategoryGroup(
      user.uid,
      parseCategoryType(type),
      parseCategoryFormValues(values),
    )
    revalidateCategoryData(user.uid)
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateCategoryGroupAction(
  groupId: unknown,
  values: CategoryFormValues,
): Promise<CategoryActionResult> {
  const user = await requireSession()

  try {
    assertCategoryId(groupId, "Nhóm hạng mục")
    await updateCategoryGroup(
      user.uid,
      groupId as string,
      parseCategoryFormValues(values),
    )
    revalidateCategoryData(user.uid)
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteCategoryGroupAction(
  groupId: unknown,
): Promise<CategoryActionResult> {
  const user = await requireSession()

  try {
    assertCategoryId(groupId, "Nhóm hạng mục")
    await archiveCategoryGroup(user.uid, groupId as string)
    revalidateCategoryData(user.uid)
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function createCategoryItemAction(
  groupId: unknown,
  values: CategoryItemFormValues,
): Promise<CategoryActionResult> {
  const user = await requireSession()

  try {
    assertCategoryId(groupId, "Nhóm hạng mục")
    await createCategoryItem(
      user.uid,
      groupId as string,
      parseCategoryItemFormValues(values),
    )
    revalidateCategoryData(user.uid)
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateCategoryItemAction(
  itemId: unknown,
  values: CategoryItemFormValues,
): Promise<CategoryActionResult> {
  const user = await requireSession()

  try {
    assertCategoryId(itemId)
    await updateCategoryItem(
      user.uid,
      itemId as string,
      parseCategoryItemFormValues(values),
    )
    revalidateCategoryData(user.uid)
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteCategoryItemAction(
  itemId: unknown,
): Promise<CategoryActionResult> {
  const user = await requireSession()

  try {
    assertCategoryId(itemId)
    await archiveCategoryItem(user.uid, itemId as string)
    revalidateCategoryData(user.uid)
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}

export type CreateSuggestedCategoryResult =
  | { success: true; itemId: string }
  | { success: false; error: string }

/**
 * Creates the category the AI assistant suggested, when the user takes it:
 * in one of their groups, or in a new group with a colour not yet used for
 * that kind. The item takes its group's icon; both can be changed later.
 */
export async function createSuggestedCategoryAction(suggestion: {
  type: unknown
  name: unknown
  groupId?: unknown
  groupName?: unknown
}): Promise<CreateSuggestedCategoryResult> {
  const user = await requireSession()

  try {
    const type = parseCategoryType(suggestion.type)
    const name = parseCategoryName(suggestion.name)
    const groups = (await getCategoryGroups(user.uid)).filter((group) => group.type === type)

    const group = await (async () => {
      if (suggestion.groupId !== undefined) {
        const existing = groups.find((item) => item.id === suggestion.groupId)
        if (!existing) throw new CategoryValidationError("Nhóm hạng mục không tồn tại.")
        return existing
      }
      const usedColors = new Set(groups.map((item) => item.colorName))
      const values = parseCategoryFormValues({
        name: suggestion.groupName,
        colorName: categoryColorOptions.find((option) => !usedColors.has(option.name))?.name ?? "blue",
        iconName: "receipt",
      })
      return { id: await createCategoryGroup(user.uid, type, values), ...values }
    })()

    const itemId = await createCategoryItem(
      user.uid,
      group.id,
      parseCategoryItemFormValues({ name, iconName: group.iconName }),
    )
    revalidateCategoryData(user.uid)
    return { success: true, itemId }
  } catch (error) {
    return failure(error)
  }
}
