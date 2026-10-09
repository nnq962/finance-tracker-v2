"use client"

import { ActionSheet } from "@/components/app/action-sheet"
import type { Account } from "@/lib/accounts/types"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"

import { deleteAccountAction } from "../../actions"

type DeleteAccountSheetProps = {
  account: Account
  onOpenChange: (open: boolean) => void
  open: boolean
  /** After the delete is confirmed (it can still be undone from the toast). */
  onConfirmed?: () => void
}

/**
 * Asks once more before an account goes, as iOS does for what takes other
 * things with it: an action sheet saying what goes too, the red "Xoá tài
 * khoản", Huỷ apart below. Confirmed, it is deleted with an undo.
 */
export function DeleteAccountSheet({
  account,
  onOpenChange,
  open,
  onConfirmed,
}: DeleteAccountSheetProps) {
  const handleDelete = () => {
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
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Xoá “${account.name}”? Mọi giao dịch, khoản vay nợ và lần trả nợ ghi vào tài khoản này cũng sẽ bị xoá.`}
      options={[{ value: "delete", label: "Xoá tài khoản", destructive: true }]}
      onSelect={handleDelete}
    />
  )
}
