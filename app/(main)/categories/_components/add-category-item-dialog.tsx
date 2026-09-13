"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CategoryGroup } from "@/lib/categories/types"

import { createCategoryItemAction } from "../actions"
import { CategoryFormDialog } from "./category-form-dialog"

type AddCategoryItemDialogProps = {
  group: CategoryGroup
  onSuccess?: () => void
}

export function AddCategoryItemDialog({
  group,
  onSuccess,
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
      submitSuccessMessage="Đã thêm hạng mục."
      initialValues={{
        name: "",
        colorName: group.colorName,
        iconName: "shopping-bag",
      }}
      onSubmit={(values) => createCategoryItemAction(group.id, values)}
      onSuccess={onSuccess}
    />
  )
}
