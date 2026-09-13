"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, Trash2Icon } from "lucide-react"
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
} from "@/components/animate-ui/components/radix/alert-dialog"
import type { Account } from "@/lib/accounts/types"

import { deleteAccountAction } from "../../actions"

type DeleteAccountAlertProps = {
  account: Account
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function DeleteAccountAlert({
  account,
  onOpenChange,
  open,
}: DeleteAccountAlertProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const result = await deleteAccountAction(account.id)

        if (result.success) {
          toast.success("Đã xoá tài khoản.")
          onOpenChange(false)
          router.refresh()
          return
        }

        setErrorMessage(result.error)
        toast.error(result.error)
      } catch {
        const message = "Không thể xoá tài khoản. Vui lòng thử lại."
        setErrorMessage(message)
        toast.error(message)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá tài khoản?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xoá tài khoản {account.name}? Hành động này không
            thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Huỷ</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleDelete}>
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
            {isPending ? "Đang xoá..." : "Xoá tài khoản"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
