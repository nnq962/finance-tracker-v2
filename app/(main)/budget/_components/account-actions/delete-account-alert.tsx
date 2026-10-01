"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
} from "@/components/animate-ui/components/radix/alert-dialog"
import type { Account } from "@/lib/accounts/types"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"

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

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onOpenChange(false)
    scheduleUndoableDelete({
      key: `account:${account.id}`,
      title: `Sắp xoá tài khoản ${account.name}`,
      description:
        "Tài khoản và toàn bộ dữ liệu liên quan sẽ bị xoá sau 6 giây.",
      pendingMessage: "Đang xoá tài khoản…",
      successMessage: "Đã xoá tài khoản.",
      undoMessage: "Đã giữ lại tài khoản.",
      errorMessage: "Không thể xoá tài khoản. Vui lòng thử lại.",
      onCommit: async () => {
        const result = await deleteAccountAction(account.id)

        if (!result.success) throw new Error(result.error)
        router.refresh()
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá tài khoản?</AlertDialogTitle>
          <AlertDialogDescription>
            Xoá tài khoản {account.name} sẽ xoá vĩnh viễn mọi giao dịch và
            khoản vay nợ có liên quan, kể cả lịch sử thanh
            toán. Số dư của các tài khoản khác trong giao dịch hoặc khoản nợ
            liên quan sẽ được đối soát lại. Sau khi xác nhận, bạn có 6 giây để
            hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            <Trash2Icon />
            Xoá tài khoản
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
