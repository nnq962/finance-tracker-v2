import { ReceiptTextIcon, SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
  /** A search or filter narrows the list, so an empty one means nothing matched. */
  isFiltering: boolean
  onClearFilters: () => void
}

export function TransactionList({
  accounts,
  categoryGroups,
  todayDateKey,
  transactions,
  isFiltering,
  onClearFilters,
}: TransactionListProps) {
  const groups = groupTransactionsByDate(transactions)

  if (groups.length === 0) {
    return isFiltering ? (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>Không có giao dịch phù hợp</EmptyTitle>
          <EmptyDescription>Thử từ khoá khác hoặc bỏ bớt điều kiện lọc.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" variant="outline" onClick={onClearFilters}>
            Xoá bộ lọc
          </Button>
        </EmptyContent>
      </Empty>
    ) : (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptTextIcon />
          </EmptyMedia>
          <EmptyTitle>Chưa có giao dịch trong tháng này</EmptyTitle>
          <EmptyDescription>Ghi khoản thu chi đầu tiên để theo dõi tiền của bạn.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <TransactionDateGroup
          accounts={accounts}
          categoryGroups={categoryGroups}
          key={group.dateKey}
          group={group}
          isToday={group.dateKey === todayDateKey}
        />
      ))}
    </div>
  )
}
