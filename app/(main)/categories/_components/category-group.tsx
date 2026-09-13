"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { getCategoryColor } from "@/lib/categories/category-colors"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import type {
  CategoryGroup as CategoryGroupType,
  CategoryItem,
} from "../_types/category"
import { AddCategoryItemDialog } from "./add-category-item-dialog"
import { DeleteCategoryGroupAlert } from "./delete-category-group-alert"
import { EditCategoryGroupDialog } from "./edit-category-group-dialog"
import { EditCategoryItemDialog } from "./edit-category-item-dialog"

type CategoryGroupProps = {
  group: CategoryGroupType
  onAddItem: (item: CategoryItem) => void
  onDeleteItem: (itemId: string) => void
  onUpdateGroup: (
    updates: Pick<CategoryGroupType, "name" | "colorName" | "iconName">
  ) => void
  onUpdateItem: (
    itemId: string,
    updates: Pick<CategoryItem, "name" | "colorName" | "iconName">
  ) => void
}

export function CategoryGroup({
  group,
  onAddItem,
  onDeleteItem,
  onUpdateGroup,
  onUpdateItem,
}: CategoryGroupProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const GroupIcon = categoryIconRegistry[group.iconName]
  const groupColor = getCategoryColor(group.colorName)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/category"
    >
      <div
        className="grid cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
        onClick={() => setIsOpen((open) => !open)}
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Mở hoặc đóng nhóm ${group.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <ChevronRightIcon className="transition-transform duration-200 group-data-[state=open]/category:rotate-90 motion-reduce:transition-none" />
          </Button>
        </CollapsibleTrigger>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${groupColor.surfaceClassName}`}
        >
          <GroupIcon className="size-5" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-base font-medium">{group.name}</h2>
          <p className="text-sm text-muted-foreground">
            {group.items.length} hạng mục chi tiết
          </p>
        </div>

        <div
          className="col-span-3 flex items-center justify-end gap-1 sm:col-span-1"
          onClick={(event) => event.stopPropagation()}
        >
          <AddCategoryItemDialog
            group={group}
            onAddItem={(item) => {
              onAddItem(item)
              setIsOpen(true)
            }}
          />
          <EditCategoryGroupDialog
            group={group}
            onUpdateGroup={onUpdateGroup}
          />
          <DeleteCategoryGroupAlert group={group} />
        </div>
      </div>

      <CollapsibleContent>
        <div className="flex flex-wrap gap-2 pt-4 pl-11">
          {group.items.map((item) => (
            <EditCategoryItemDialog
              key={item.id}
              group={group}
              item={item}
              onDeleteItem={() => onDeleteItem(item.id)}
              onUpdateItem={(updates) => onUpdateItem(item.id, updates)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
