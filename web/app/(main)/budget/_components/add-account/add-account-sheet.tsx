"use client"

import * as React from "react"

import { PageSheet } from "@/components/app/page-sheet"

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
    <PageSheet title="Thêm tài khoản" open={open} onOpenChange={setOpen} trigger={trigger}>
      <AccountForm
        action={createAccountAction}
        onSuccess={() => setOpen(false)}
        successMessage="Đã thêm tài khoản."
      />
    </PageSheet>
  )
}
