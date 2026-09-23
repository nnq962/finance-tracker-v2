"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
}

export function AddTransactionSheet({
  accounts,
  categoryGroups,
}: AddTransactionSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [kind, setKind] = React.useState<SupportedTransactionKind>("expense")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button">
          <PlusIcon />
          Thêm giao dịch
        </Button>
      </SheetTrigger>
      <SheetContent onOpenAutoFocus={(event) => event.preventDefault()} className="data-[side=right]:w-full sm:max-w-md!">
        <SheetHeader>
          <SheetTitle>Giao dịch mới</SheetTitle>
          <SheetDescription>
            Ghi lại dòng tiền mới vào sổ tài chính của bạn.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <TransactionKindSelector value={kind} onValueChange={setKind} />
        </div>
        <TransactionForm
          key={kind}
          accounts={accounts}
          action={createTransactionAction}
          categoryGroups={categoryGroups}
          kind={kind}
          onSuccess={() => setOpen(false)}
          successMessage="Đã thêm giao dịch."
        />
      </SheetContent>
    </Sheet>
  )
}
