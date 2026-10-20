"use server"

import { revalidatePath, updateTag } from "next/cache"

import { isDevSessionUser, requireSession } from "@/lib/auth/session"
import { categoryGroupsCacheTag } from "@/lib/cache-tags"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"
import { notifyOps } from "@/lib/ops/telegram"

import { DELETE_ACCOUNT_WORD, isDeleteAccountWord, isWipeConfirmWord, WIPE_CONFIRM_WORD } from "./confirm"
import { deleteUserRow, wipeUserData } from "./repository"

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

/**
 * Deletes the signed-in account for good (2026-10-20): the Google sign-in is
 * revoked and removed from Firebase, then the user's row goes and every
 * table cascades. The dev user has no Firebase account, so only its row
 * goes (the next dev sign-in seeds it again). The client then clears the
 * session cookie and leaves for the landing page.
 */
export async function deleteAccountAction(
  word: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireSession()
  if (!isDeleteAccountWord(word)) return { success: false, error: `Gõ ${DELETE_ACCOUNT_WORD} để xác nhận.` }

  try {
    if (!isDevSessionUser(user)) {
      const auth = getFirebaseAdminAuth()
      await auth.revokeRefreshTokens(user.uid).catch(() => undefined)
      try {
        await auth.deleteUser(user.uid)
      } catch (error) {
        if ((error as { code?: string }).code !== "auth/user-not-found") throw error
      }
    }
    await deleteUserRow(user.uid)
  } catch (error) {
    console.error("Deleting the account failed", error)
    return { success: false, error: "Không xoá được tài khoản. Vui lòng thử lại." }
  }

  // Counts only: the admin learns that an account left, not whose.
  notifyOps("🗑 Một tài khoản vừa tự xoá", { silent: true })
  return { success: true }
}
