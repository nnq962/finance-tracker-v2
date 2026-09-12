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
} from "@/components/animate-ui/components/radix/alert-dialog"

import type { Account } from "../../_types/account"

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
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            <Trash2Icon />
            Xoá tài khoản
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
