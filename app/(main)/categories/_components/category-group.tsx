"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryGroup as CategoryGroupType } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import { AddCategoryItemDialog } from "./add-category-item-dialog"
import { DeleteCategoryGroupAlert } from "./delete-category-group-alert"
import { EditCategoryGroupDialog } from "./edit-category-group-dialog"
import { EditCategoryItemDialog } from "./edit-category-item-dialog"

type CategoryGroupProps = {
  group: CategoryGroupType
}

export function CategoryGroup({ group }: CategoryGroupProps) {
  const GroupIcon = categoryIconRegistry[group.iconName]
  const groupColor = getCategoryColor(group.colorName)

  return (
    <Card className="min-h-80 lg:min-h-[32rem]">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${groupColor.surfaceClassName}`}
          >
            <GroupIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <h2 className="truncate text-2xl font-semibold tracking-tight">
              {group.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.items.length} hạng mục chi tiết
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <EditCategoryGroupDialog group={group} />
            <DeleteCategoryGroupAlert group={group} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Hạng mục chi tiết
        </p>
        <div className="flex flex-wrap gap-2">
          {group.items.map((item) => (
            <EditCategoryItemDialog
              key={item.id}
              group={group}
              item={item}
            />
          ))}
          <AddCategoryItemDialog group={group} label="Thêm hạng mục" />
        </div>
      </CardContent>
    </Card>
  )
}
