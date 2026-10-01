"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
        className="gap-0 data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Chỉnh sửa tài khoản</SheetTitle>
          <SheetDescription>
            Cập nhật thông tin và số dư của tài khoản {account.name}.
          </SheetDescription>
        </SheetHeader>
        <AccountForm
          defaultValues={{
            name: account.name,
            type: account.type,
            institutionId: account.institutionId,
            balance: account.balance,
            note: account.note,
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
