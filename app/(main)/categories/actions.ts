"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import {
  archiveCategoryGroup,
  archiveCategoryItem,
  createCategoryGroup,
  createCategoryItem,
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
  parseCategoryType,
} from "@/lib/categories/validation"

function failure(error: unknown): CategoryActionResult {
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
    revalidatePath("/categories")
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
    revalidatePath("/categories")
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
    revalidatePath("/categories")
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
    revalidatePath("/categories")
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
    revalidatePath("/categories")
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
    revalidatePath("/categories")
    return { success: true }
  } catch (error) {
    return failure(error)
  }
}
