"use client"

import { Button } from "@/components/ui/button"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryGroup, CategoryItem } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import {
  deleteCategoryItemAction,
  updateCategoryItemAction,
} from "../actions"
import { CategoryFormDialog } from "./category-form-dialog"

type EditCategoryItemDialogProps = {
  group: CategoryGroup
  item: CategoryItem
}

export function EditCategoryItemDialog({
  group,
  item,
}: EditCategoryItemDialogProps) {
  const ItemIcon = categoryIconRegistry[item.iconName]
  const itemColor = getCategoryColor(group.colorName)

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
      showColorPicker={false}
      submitLabel="Lưu thay đổi"
      submitSuccessMessage="Đã cập nhật hạng mục."
      initialValues={{
        name: item.name,
        colorName: group.colorName,
        iconName: item.iconName,
      }}
      deleteDescription={
        <>
          Bạn có chắc muốn xoá “{item.name}” khỏi nhóm “{group.name}”? Hành
          động này không thể hoàn tác.
        </>
      }
      deleteSuccessMessage="Đã xoá hạng mục."
      onDelete={() => deleteCategoryItemAction(item.id)}
      onSubmit={(values) =>
        updateCategoryItemAction(item.id, {
          name: values.name,
          iconName: values.iconName,
        })
      }
    />
  )
}
