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
  trigger?: React.ReactNode
  /** Controlled mode, e.g. opened from the first-run guide. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddAccountSheet({ trigger, open: controlledOpen, onOpenChange }: AddAccountSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent
        showCloseButton={false}
        aria-describedby={undefined}
        variant="screen"
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
