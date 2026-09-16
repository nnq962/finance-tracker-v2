"use client"

import * as React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
      <SheetContent className="data-[side=right]:w-full sm:max-w-md!">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa giao dịch</SheetTitle>
          <SheetDescription>
            Thay đổi thông tin sẽ tự động đối soát lại số dư tài khoản.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <TransactionKindSelector value={kind} onValueChange={setKind} />
        </div>
        <TransactionForm
          key={`${transaction.id}-${kind}`}
          accounts={accounts}
          action={updateTransactionAction.bind(null, transaction.id)}
          categoryGroups={categoryGroups}
          defaultValues={kind === transaction.kind ? transaction : undefined}
          kind={kind}
          onSuccess={() => onOpenChange(false)}
          submitLabel="Lưu thay đổi"
          successMessage="Đã cập nhật giao dịch."
        />
      </SheetContent>
    </Sheet>
  )
}
