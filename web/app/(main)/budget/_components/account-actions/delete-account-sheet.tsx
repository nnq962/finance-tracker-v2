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
  /** Offered instead when the account cannot be deleted; unset once locked. */
  onArchive?: () => void
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
  onArchive,
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

  // Tied to other accounts or to loans: deleting it would change their
  // balances, so it can only be locked (2026-10-12).
  if (account.linked) {
    return (
      <ActionSheet
        open={open}
        onOpenChange={onOpenChange}
        title={`Không xoá được “${account.name}” vì đã có chuyển khoản hoặc vay nợ.${onArchive ? " Bạn có thể khoá để ẩn tài khoản." : ""}`}
        options={onArchive ? [{ value: "archive", label: "Khoá tài khoản" }] : []}
        onSelect={() => onArchive?.()}
        cancelLabel={onArchive ? "Huỷ" : "Đóng"}
      />
    )
  }

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Xoá “${account.name}”? Các khoản thu chi của tài khoản này cũng sẽ bị xoá.`}
      options={[{ value: "delete", label: "Xoá tài khoản", destructive: true }]}
      onSelect={handleDelete}
    />
  )
}
