"use client"

import { PageSheet } from "@/components/app/page-sheet"
import type { Account } from "@/lib/accounts/types"

import { AccountForm } from "../account-form/account-form"
import { updateAccountAction } from "../../actions"

type EditAccountSheetProps = {
  account: Account
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function EditAccountSheet({ account, onOpenChange, open }: EditAccountSheetProps) {
  return (
    <PageSheet title="Chỉnh sửa tài khoản" open={open} onOpenChange={onOpenChange}>
      <AccountForm
        defaultValues={{
          name: account.name,
          type: account.type,
          institutionId: account.institutionId,
          balance: account.balance,
          note: account.note,
          openedAt: new Date(account.openedAt),
        }}
        expectedBalance={account.balance}
        submitLabel="Lưu thay đổi"
        action={updateAccountAction.bind(null, account.id)}
        onSuccess={() => onOpenChange(false)}
        successMessage="Đã cập nhật tài khoản."
      />
    </PageSheet>
  )
}
