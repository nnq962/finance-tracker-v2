"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"

import type { CategoryGroup, CategoryType } from "../_types/category"
import { CategoryFormDialog } from "./category-form-dialog"

type AddCategoryGroupDialogProps = {
  type: CategoryType
  onAddGroup: (group: CategoryGroup) => void
}

export function AddCategoryGroupDialog({
  type,
  onAddGroup,
}: AddCategoryGroupDialogProps) {
  const isExpense = type === "expense"
  const typeLabel = isExpense ? "chi" : "thu"

  return (
    <CategoryFormDialog
      trigger={
        <Button type="button" variant="outline">
          <PlusIcon />
          Thêm nhóm {typeLabel} mới
        </Button>
      }
      title={`Thêm nhóm ${typeLabel}`}
      description={`Tạo một nhóm hạng mục mới cho các khoản ${typeLabel}.`}
      nameLabel="Tên nhóm"
      namePlaceholder={isExpense ? "Ví dụ: Ăn uống" : "Ví dụ: Thu nhập"}
      submitLabel="Thêm nhóm"
      initialValues={{
        name: "",
        colorName: isExpense ? "orange" : "emerald",
        iconName: isExpense ? "utensils" : "hand-coins",
      }}
      onSubmit={(values) =>
        onAddGroup({
          id: crypto.randomUUID(),
          type,
          items: [],
          ...values,
        })
      }
    />
  )
}
