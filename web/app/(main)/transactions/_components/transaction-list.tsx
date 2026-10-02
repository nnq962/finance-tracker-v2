import { ReceiptTextIcon } from "lucide-react"

import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { groupTransactionsByDate } from "../_lib/group-transactions-by-date"
import type { Transaction } from "../_types/transaction"
import { TransactionDateGroup } from "./transaction-date-group"

type TransactionListProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  todayDateKey: string
  transactions: Transaction[]
}

export function TransactionList({
  accounts,
  categoryGroups,
  todayDateKey,
  transactions,
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
    <div>
      {groups.map((group, index) => (
        <TransactionDateGroup
          accounts={accounts}
          categoryGroups={categoryGroups}
          key={group.dateKey}
          group={group}
          isToday={group.dateKey === todayDateKey}
          showConnector={index < groups.length - 1}
        />
      ))}
    </div>
  )
}
