"use client"

import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { CategoryGroup } from "../_types/category"
import { CategoryFormDialog } from "./category-form-dialog"

type CategoryGroupUpdate = Pick<
  CategoryGroup,
  "name" | "colorName" | "iconName"
>

type EditCategoryGroupDialogProps = {
  group: CategoryGroup
  onUpdateGroup: (updates: CategoryGroupUpdate) => void
}

export function EditCategoryGroupDialog({
  group,
  onUpdateGroup,
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
      initialValues={{
        name: group.name,
        colorName: group.colorName,
        iconName: group.iconName,
      }}
      onSubmit={onUpdateGroup}
    />
  )
}
