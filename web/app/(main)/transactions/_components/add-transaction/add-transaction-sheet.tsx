"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { Button } from "@/components/ui/button"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { SupportedTransactionKind } from "@/lib/transactions/types"

import { createTransactionAction } from "../../actions"
import { TransactionForm } from "./transaction-form"
import { TransactionKindSelector } from "./transaction-kind-selector"

type AddTransactionSheetProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  /** Controlled mode without the trigger button, e.g. from the first-run checklist. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddTransactionSheet({
  accounts,
  categoryGroups,
  open: controlledOpen,
  onOpenChange,
}: AddTransactionSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [categoryManagementOpen, setCategoryManagementOpen] = React.useState(false)
  const [kind, setKind] = React.useState<SupportedTransactionKind>("expense")

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        {controlledOpen === undefined ? (
          <SheetTrigger asChild>
            <Button type="button" className="w-full sm:w-auto">
              <PlusIcon />
              Thêm giao dịch
            </Button>
          </SheetTrigger>
        ) : null}
        <SheetContent showCloseButton={false} aria-describedby={undefined} onOpenAutoFocus={(event) => event.preventDefault()} className="gap-0 data-[side=right]:w-full sm:max-w-md!">
          <SheetNavHeader title="Giao dịch mới" />
          <div className="px-4 pb-4">
            <TransactionKindSelector value={kind} onValueChange={setKind} />
          </div>
          <TransactionForm
            key={kind}
            accounts={accounts}
            action={createTransactionAction}
            categoryGroups={categoryGroups}
            isCreating
            kind={kind}
            onManageCategories={() => setCategoryManagementOpen(true)}
            onSuccess={() => setOpen(false)}
            successMessage="Đã thêm giao dịch."
          />
        </SheetContent>
      </Sheet>
      <CategoryManagementSheet
        key={kind}
        groups={categoryGroups}
        initialType={kind === "income" ? "income" : "expense"}
        open={categoryManagementOpen}
        onOpenChange={setCategoryManagementOpen}
      />
    </>
  )
}
