"use client"

import * as React from "react"

import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetContent,
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
        showCloseButton={false}
        aria-describedby={undefined}
        className="gap-0 data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetNavHeader title="Thêm tài khoản" />
        <AccountForm
          action={createAccountAction}
          onSuccess={() => setOpen(false)}
          successMessage="Đã thêm tài khoản."
        />
      </SheetContent>
    </Sheet>
  )
}
