import { ReceiptTextIcon } from "lucide-react"

import { groupTransactionsByDate } from "../_lib/group-transactions-by-date"
import type { Transaction } from "../_types/transaction"
import { TransactionDateGroup } from "./transaction-date-group"

type TransactionListProps = {
  transactions: Transaction[]
  onDelete: (transactionId: string) => void
}

export function TransactionList({
  transactions,
  onDelete,
}: TransactionListProps) {
  const groups = groupTransactionsByDate(transactions)

  if (groups.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
        <ReceiptTextIcon className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Không tìm thấy giao dịch</p>
          <p className="text-sm text-muted-foreground">
            Hãy thử từ khoá hoặc loại giao dịch khác.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <TransactionDateGroup
          key={group.dateKey}
          group={group}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
