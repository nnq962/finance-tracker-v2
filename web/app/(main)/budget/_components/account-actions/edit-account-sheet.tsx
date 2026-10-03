"use client"

import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="gap-0 data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetNavHeader title="Chỉnh sửa tài khoản" />
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
      </SheetContent>
    </Sheet>
  )
}
