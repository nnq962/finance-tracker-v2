import "server-only"

import { ensureDefaultCategories } from "@/lib/categories/repository"

export async function initializeUserWorkspace(userId: string) {
  await ensureDefaultCategories(userId)
}
