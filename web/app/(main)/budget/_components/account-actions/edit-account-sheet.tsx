"use client"

import * as React from "react"
import { toast } from "sonner"

import { PageSheet } from "@/components/app/page-sheet"
import type { Account } from "@/lib/accounts/types"

import { AccountForm } from "../account-form/account-form"
import { setAccountArchivedAction, updateAccountAction } from "../../actions"
import { DeleteAccountSheet } from "./delete-account-sheet"

type EditAccountSheetProps = {
  account: Account
  onOpenChange: (open: boolean) => void
  open: boolean
  /** Once a delete is confirmed: the account's own sheet closes too. */
  onDeleted?: () => void
}

/**
 * The account's form, and what is seldom done to an account, kept here
 * rather than on its sheet (2026-10-13): locking it, the last switch, saved
 * with Save, and deleting it, the red bin beside Save. A locked account's
 * fields are shown but stay as they are until it is switched back.
 */
export function EditAccountSheet({ account, onOpenChange, open, onDeleted }: EditAccountSheetProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const isLocked = account.status === "archived"
  const setLocked = (locked: boolean) => setAccountArchivedAction(account.id, locked)

  // Offered by the delete sheet when the account cannot go: locked at once.
  const lockInstead = async () => {
    try {
      const result = await setLocked(true)
      if (!result.success) return toast.error(result.error)
      toast.success("Đã khoá tài khoản.")
      onOpenChange(false)
    } catch {
      toast.error("Không thể khoá tài khoản. Vui lòng thử lại.")
    }
  }

  return (
    <>
      <PageSheet title="Chỉnh sửa tài khoản" open={open} onOpenChange={onOpenChange}>
        <AccountForm
          defaultValues={{
            name: account.name,
            type: account.type,
            institutionId: account.institutionId,
            balance: account.balance,
            note: account.note,
            openedAt: new Date(account.openedAt),
            excluded: account.excluded,
          }}
          expectedBalance={account.balance}
          submitLabel="Lưu thay đổi"
          action={updateAccountAction.bind(null, account.id)}
          onSuccess={() => onOpenChange(false)}
          successMessage="Đã cập nhật tài khoản."
          lock={{ locked: isLocked, setLocked }}
          onDelete={() => setDeleteOpen(true)}
        />
      </PageSheet>
      <DeleteAccountSheet
        account={account}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirmed={() => {
          onOpenChange(false)
          onDeleted?.()
        }}
        onArchive={isLocked ? undefined : lockInstead}
      />
    </>
  )
}
