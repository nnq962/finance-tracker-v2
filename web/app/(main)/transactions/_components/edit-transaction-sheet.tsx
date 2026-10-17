"use client"

import * as React from "react"

import { PageSheet } from "@/components/app/page-sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type {
  SupportedTransactionKind,
  Transaction,
} from "@/lib/transactions/types"

import { updateTransactionAction } from "../actions"
import { deleteTransactionWithUndo } from "./delete-transaction"
import { TransactionForm } from "./add-transaction/transaction-form"
import { TransactionKindSelector } from "./add-transaction/transaction-kind-selector"

type EditTransactionSheetProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  onOpenChange: (open: boolean) => void
  open: boolean
  transaction: Transaction
}

/**
 * The transaction's form, and deleting it, the red bin beside Save (moved
 * here from its details on 2026-10-13, as for an account). Deleting waits six
 * seconds with an undo, so it needs no confirmation first.
 */
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

  const handleDelete = () => {
    onOpenChange(false)
    deleteTransactionWithUndo(transaction)
  }

  return (
    <PageSheet
      title="Chỉnh sửa giao dịch"
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setKind(transaction.kind)
        onOpenChange(nextOpen)
      }}
    >
      {/* Switching tabs keeps the amount, time and note, as in the add sheet. */}
      <TransactionForm
        key={transaction.id}
        accounts={accounts}
        action={updateTransactionAction.bind(null, transaction.id)}
        categoryGroups={categoryGroups}
        defaultValues={transaction}
        header={<TransactionKindSelector value={kind} onValueChange={setKind} />}
        kind={kind}
        onSuccess={() => onOpenChange(false)}
        submitLabel="Lưu thay đổi"
        successMessage="Đã cập nhật giao dịch."
        onDelete={handleDelete}
      />
    </PageSheet>
  )
}
