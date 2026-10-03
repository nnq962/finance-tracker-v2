"use client"

import * as React from "react"
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
  /** After the delete is confirmed (it can still be undone from the toast). */
  onConfirmed?: () => void
}

export function DeleteAccountAlert({
  account,
  onOpenChange,
  open,
  onConfirmed,
}: DeleteAccountAlertProps) {

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onOpenChange(false)
    onConfirmed?.()
    scheduleUndoableDelete({
      key: `account:${account.id}`,
      title: `Đã xoá “${account.name}”`,
      pendingMessage: "Đang xoá tài khoản…",
      undoMessage: "Đã giữ lại tài khoản.",
      errorMessage: "Không thể xoá tài khoản. Vui lòng thử lại.",
      onCommit: async () => {
        const result = await deleteAccountAction(account.id)

        if (!result.success) throw new Error(result.error)
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá tài khoản?</AlertDialogTitle>
          <AlertDialogDescription>
            Mọi giao dịch và khoản vay nợ của {account.name} cũng sẽ bị xoá.
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
