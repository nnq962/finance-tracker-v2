import "server-only"

import { ensureDefaultCategories } from "@/lib/categories/repository"

/** Creates the user's row and defaults on first sign in; `isNew` the first time. */
export async function initializeUserWorkspace(userId: string) {
  return ensureDefaultCategories(userId)
}
