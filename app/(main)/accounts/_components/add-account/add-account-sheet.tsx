"use client"

import * as React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { AccountForm } from "../account-form/account-form"
import { createAccountAction } from "../../actions"

type AddAccountSheetProps = {
  trigger: React.ReactNode
}

export function AddAccountSheet({ trigger }: AddAccountSheetProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="data-[side=right]:w-full sm:max-w-xl!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Thêm tài khoản</SheetTitle>
          <SheetDescription>
            Nhập thông tin và số dư ban đầu của tài khoản mới.
          </SheetDescription>
        </SheetHeader>
        <AccountForm
          action={createAccountAction}
          onSuccess={() => setOpen(false)}
          successMessage="Đã thêm tài khoản."
        />
      </SheetContent>
    </Sheet>
  )
}
