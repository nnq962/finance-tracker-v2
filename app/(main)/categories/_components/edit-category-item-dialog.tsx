"use client"

import { Button } from "@/components/ui/button"
import { getCategoryColor } from "@/lib/categories/category-colors"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import type { CategoryGroup, CategoryItem } from "../_types/category"
import { CategoryFormDialog } from "./category-form-dialog"

type CategoryItemUpdate = Pick<
  CategoryItem,
  "name" | "colorName" | "iconName"
>

type EditCategoryItemDialogProps = {
  group: CategoryGroup
  item: CategoryItem
  onDeleteItem: () => void
  onUpdateItem: (updates: CategoryItemUpdate) => void
}

export function EditCategoryItemDialog({
  group,
  item,
  onDeleteItem,
  onUpdateItem,
}: EditCategoryItemDialogProps) {
  const ItemIcon = categoryIconRegistry[item.iconName]
  const itemColor = getCategoryColor(item.colorName)

  return (
    <CategoryFormDialog
      trigger={
        <Button type="button" variant="outline">
          <ItemIcon
            data-icon="inline-start"
            className={itemColor.iconClassName}
          />
          {item.name}
        </Button>
      }
      title="Sửa hạng mục"
      description={
        <>
          Cập nhật “{item.name}” trong nhóm “{group.name}”.
        </>
      }
      nameLabel="Tên hạng mục"
      submitLabel="Lưu thay đổi"
      initialValues={{
        name: item.name,
        colorName: item.colorName,
        iconName: item.iconName,
      }}
      deleteDescription={
        <>
          Bạn có chắc muốn xoá “{item.name}” khỏi nhóm “{group.name}”? Hành
          động này không thể hoàn tác.
        </>
      }
      onDelete={onDeleteItem}
      onSubmit={onUpdateItem}
    />
  )
}
