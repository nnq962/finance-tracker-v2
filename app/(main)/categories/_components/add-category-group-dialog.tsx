"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"
import type { CategoryType } from "@/lib/categories/types"

import { createCategoryGroupAction } from "../actions"
import { CategoryFormDialog } from "./category-form-dialog"

type AddCategoryGroupDialogProps = {
  type: CategoryType
}

export function AddCategoryGroupDialog({ type }: AddCategoryGroupDialogProps) {
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
      submitSuccessMessage="Đã thêm nhóm hạng mục."
      initialValues={{
        name: "",
        colorName: isExpense ? "orange" : "emerald",
        iconName: isExpense ? "utensils" : "hand-coins",
      }}
      onSubmit={(values) => createCategoryGroupAction(type, values)}
    />
  )
}
