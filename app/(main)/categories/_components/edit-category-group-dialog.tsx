"use client"

import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CategoryGroup } from "@/lib/categories/types"

import { updateCategoryGroupAction } from "../actions"
import { CategoryFormDialog } from "./category-form-dialog"

type EditCategoryGroupDialogProps = {
  group: CategoryGroup
}

export function EditCategoryGroupDialog({
  group,
}: EditCategoryGroupDialogProps) {
  const groupTypeLabel = group.type === "expense" ? "chi" : "thu"

  return (
    <CategoryFormDialog
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Sửa nhóm ${group.name}`}
        >
          <PencilIcon />
        </Button>
      }
      title={`Sửa nhóm ${groupTypeLabel}`}
      description={<>Cập nhật thông tin cho nhóm “{group.name}”.</>}
      nameLabel="Tên nhóm"
      submitLabel="Lưu thay đổi"
      submitSuccessMessage="Đã cập nhật nhóm hạng mục."
      initialValues={{
        name: group.name,
        colorName: group.colorName,
        iconName: group.iconName,
      }}
      onSubmit={(values) => updateCategoryGroupAction(group.id, values)}
    />
  )
}
