"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CategoryGroup } from "@/lib/categories/types"

import { createCategoryItemAction } from "../actions"
import { CategoryFormDialog } from "./category-form-dialog"

type AddCategoryItemDialogProps = {
  group: CategoryGroup
  label?: string
  onSuccess?: () => void
}

export function AddCategoryItemDialog({
  group,
  label,
  onSuccess,
}: AddCategoryItemDialogProps) {
  return (
    <CategoryFormDialog
      trigger={
        <Button
          type="button"
          variant={label ? "outline" : "ghost"}
          size={label ? "default" : "icon"}
          aria-label={`Thêm hạng mục vào nhóm ${group.name}`}
        >
          <PlusIcon />
          {label}
        </Button>
      }
      title={<>Thêm vào “{group.name}”</>}
      description="Tạo một hạng mục chi tiết mới trong nhóm này."
      nameLabel="Tên hạng mục"
      namePlaceholder="Ví dụ: Mua đồ ăn sáng"
      showColorPicker={false}
      submitLabel="Lưu hạng mục"
      submitSuccessMessage="Đã thêm hạng mục."
      initialValues={{
        name: "",
        colorName: group.colorName,
        iconName: "shopping-bag",
      }}
      onSubmit={(values) =>
        createCategoryItemAction(group.id, {
          name: values.name,
          iconName: values.iconName,
        })
      }
      onSuccess={onSuccess}
    />
  )
}
