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

const transactionKinds: SupportedTransactionKind[] = ["expense", "income", "transfer"]

type AddTransactionSheetProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  /** Controlled mode without the trigger button, e.g. from the first-run checklist. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The tab it opens on, e.g. transfer for the transfer mission. */
  initialKind?: SupportedTransactionKind
}

export function AddTransactionSheet({
  accounts,
  categoryGroups,
  open: controlledOpen,
  onOpenChange,
  initialKind = "expense",
}: AddTransactionSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [categoryManagementOpen, setCategoryManagementOpen] = React.useState(false)
  const [kind, setKind] = React.useState<SupportedTransactionKind>(initialKind)

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
          {/* One form per kind, all kept: switching tabs hides the others
              rather than clearing what was half filled in. Closing the sheet
              starts them over. */}
          {transactionKinds.map((formKind) => (
            <div key={formKind} className={formKind === kind ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
              <TransactionForm
                accounts={accounts}
                action={createTransactionAction}
                categoryGroups={categoryGroups}
                isCreating
                kind={formKind}
                onManageCategories={() => setCategoryManagementOpen(true)}
                onSuccess={() => setOpen(false)}
                successMessage="Đã thêm giao dịch."
              />
            </div>
          ))}
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
