"use client"

import { Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/animate-ui/components/radix/alert-dialog"
import { Button } from "@/components/ui/button"

import type { CategoryGroup } from "../_types/category"

type DeleteCategoryGroupAlertProps = {
  group: CategoryGroup
}

export function DeleteCategoryGroupAlert({
  group,
}: DeleteCategoryGroupAlertProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Xoá nhóm ${group.name}`}
        >
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá nhóm?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xoá nhóm {group.name} cùng {group.items.length} hạng
            mục chi tiết? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction>
            <Trash2Icon />
            Xoá nhóm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
