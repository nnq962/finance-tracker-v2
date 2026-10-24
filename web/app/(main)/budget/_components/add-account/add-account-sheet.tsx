"use client"

import * as React from "react"

import { PageSheet } from "@/components/app/page-sheet"

import type { AccountType } from "@/lib/accounts/types"

import { AccountForm } from "../account-form/lazy-account-form"
import { createAccountAction } from "../../actions"

type AddAccountSheetProps = {
  trigger?: React.ReactNode
  /** Controlled mode, e.g. opened from the first-run guide. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The type to start on, as picked on the + of Tài khoản; the form can still change it. */
  initialType?: AccountType
}

export function AddAccountSheet({ trigger, open: controlledOpen, onOpenChange, initialType }: AddAccountSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  return (
    <PageSheet title="Thêm tài khoản" open={open} onOpenChange={setOpen} trigger={trigger}>
      <AccountForm
        // A fresh form for each type picked.
        key={initialType}
        initialType={initialType}
        action={createAccountAction}
        onSuccess={() => setOpen(false)}
        successMessage="Đã thêm tài khoản."
      />
    </PageSheet>
  )
}
