import { Separator } from "@/components/ui/separator"
import type { CategoryType } from "@/lib/categories/types"

import { AddCategoryGroupDialog } from "./add-category-group-dialog"

type CategoriesHeaderProps = {
  type: CategoryType
}

export function CategoriesHeader({ type }: CategoriesHeaderProps) {
  return (
    <header className="space-y-6 pt-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">
            Hạng mục thu & chi
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Tạo, sắp xếp và quản lý các hạng mục cho từng dòng tiền.
          </p>
        </div>
        <div className="shrink-0 self-start sm:self-auto">
          <AddCategoryGroupDialog type={type} />
        </div>
      </div>
      <Separator />
    </header>
  )
}
