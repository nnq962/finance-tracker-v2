"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type { Account } from "../../_types/account"
import { AccountForm } from "../account-form/account-form"

type EditAccountSheetProps = {
  account: Account
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function EditAccountSheet({ account, onOpenChange, open }: EditAccountSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="data-[side=right]:w-full sm:max-w-xl!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Chỉnh sửa tài khoản</SheetTitle>
          <SheetDescription>
            Cập nhật thông tin của tài khoản {account.name}.
          </SheetDescription>
        </SheetHeader>
        <AccountForm
          defaultValues={{
            name: account.name,
            type: account.type,
            provider: account.provider,
            balance: account.balance,
            note: account.note,
            excludeFromReports: account.excludeFromReports,
          }}
          showBalance={false}
          submitLabel="Lưu thay đổi"
          onSubmit={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
