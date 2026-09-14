import { requireSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"

import { CategoriesManager } from "./_components/categories-manager"

export default async function CategoriesPage() {
  const user = await requireSession()
  const groups = await getCategoryGroups(user.uid)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <CategoriesManager groups={groups} />
    </div>
  )
}
