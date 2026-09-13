"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { CategoryGroup, CategoryItem } from "../_types/category"
import { CategoryFormDialog } from "./category-form-dialog"

type AddCategoryItemDialogProps = {
  group: CategoryGroup
  onAddItem: (item: CategoryItem) => void
}

export function AddCategoryItemDialog({
  group,
  onAddItem,
}: AddCategoryItemDialogProps) {
  return (
    <CategoryFormDialog
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Thêm hạng mục vào nhóm ${group.name}`}
        >
          <PlusIcon />
        </Button>
      }
      title={<>Thêm vào “{group.name}”</>}
      description="Tạo một hạng mục chi tiết mới trong nhóm này."
      nameLabel="Tên hạng mục"
      namePlaceholder="Ví dụ: Mua đồ ăn sáng"
      submitLabel="Lưu hạng mục"
      initialValues={{
        name: "",
        colorName: group.colorName,
        iconName: "shopping-bag",
      }}
      onSubmit={(values) =>
        onAddItem({
          id: crypto.randomUUID(),
          ...values,
        })
      }
    />
  )
}
