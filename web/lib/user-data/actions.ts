"use server"

import { revalidatePath, updateTag } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { categoryGroupsCacheTag } from "@/lib/cache-tags"

import { isWipeConfirmWord, WIPE_CONFIRM_WORD } from "./confirm"
import { wipeUserData } from "./repository"

/** Deletes all of the signed-in user's data; `word` is what they typed to confirm. */
export async function wipeUserDataAction(
  word: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireSession()
  if (!isWipeConfirmWord(word)) return { success: false, error: `Gõ ${WIPE_CONFIRM_WORD} để xác nhận.` }

  try {
    await wipeUserData(user.uid)
  } catch (error) {
    console.error("Wiping user data failed", error)
    return { success: false, error: "Không xoá được dữ liệu. Vui lòng thử lại." }
  }

  updateTag(categoryGroupsCacheTag(user.uid))
  revalidatePath("/", "layout")
  return { success: true }
}
