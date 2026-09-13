import { CategoriesHeader } from "./_components/categories-header"
import { CategoriesManager } from "./_components/categories-manager"

export default function CategoriesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <CategoriesHeader />
      <CategoriesManager />
    </div>
  )
}
