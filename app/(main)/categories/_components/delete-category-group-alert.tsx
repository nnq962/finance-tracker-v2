"use client"

import * as React from "react"
import { LoaderCircleIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { FieldError } from "@/components/ui/field"
import type { CategoryGroup } from "@/lib/categories/types"

import { deleteCategoryGroupAction } from "../actions"

type DeleteCategoryGroupAlertProps = {
  group: CategoryGroup
}

export function DeleteCategoryGroupAlert({
  group,
}: DeleteCategoryGroupAlertProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return
        setOpen(nextOpen)
        if (nextOpen) setErrorMessage(null)
      }}
    >
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
            mục chi tiết? Các mục đã dùng trong lịch sử giao dịch vẫn được giữ
            lại.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              setErrorMessage(null)
              startTransition(async () => {
                try {
                  const result = await deleteCategoryGroupAction(group.id)

                  if (!result.success) {
                    setErrorMessage(result.error)
                    toast.error(result.error)
                    return
                  }

                  setOpen(false)
                  toast.success("Đã xoá nhóm hạng mục.")
                  router.refresh()
                } catch {
                  const message = "Không thể xoá nhóm. Vui lòng thử lại."
                  setErrorMessage(message)
                  toast.error(message)
                }
              })
            }}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
            {isPending ? "Đang xoá..." : "Xoá nhóm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
