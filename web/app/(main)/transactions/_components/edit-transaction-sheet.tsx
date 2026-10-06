"use client"

import * as React from "react"

import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type {
  SupportedTransactionKind,
  Transaction,
} from "@/lib/transactions/types"

import { updateTransactionAction } from "../actions"
import { TransactionForm } from "./add-transaction/transaction-form"
import { TransactionKindSelector } from "./add-transaction/transaction-kind-selector"

type EditTransactionSheetProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  onOpenChange: (open: boolean) => void
  open: boolean
  transaction: Transaction
}

export function EditTransactionSheet({
  accounts,
  categoryGroups,
  onOpenChange,
  open,
  transaction,
}: EditTransactionSheetProps) {
  const [kind, setKind] = React.useState<SupportedTransactionKind>(
    transaction.kind,
  )

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setKind(transaction.kind)
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent showCloseButton={false} aria-describedby={undefined} onOpenAutoFocus={(event) => event.preventDefault()} variant="screen">
        <SheetNavHeader title="Chỉnh sửa giao dịch" />
        <div className="px-4 pb-4">
          <TransactionKindSelector value={kind} onValueChange={setKind} />
        </div>
        {/* Switching tabs keeps the amount, time and note, as in the add sheet. */}
        <TransactionForm
          key={transaction.id}
          accounts={accounts}
          action={updateTransactionAction.bind(null, transaction.id)}
          categoryGroups={categoryGroups}
          defaultValues={transaction}
          kind={kind}
          onSuccess={() => onOpenChange(false)}
          submitLabel="Lưu thay đổi"
          successMessage="Đã cập nhật giao dịch."
        />
      </SheetContent>
    </Sheet>
  )
}
