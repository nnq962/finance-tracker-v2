import { SettingsGroup } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDayLabel } from "@/lib/format-date"
import { cn } from "@/lib/utils"

import { TransactionItem } from "./transaction-item"

import { getTransactionSummary } from "../_lib/get-transaction-summary"
import { cashFlowColors } from "../_lib/transaction-presentation"
import type { TransactionDateGroup as TransactionDateGroupModel } from "../_types/transaction"

type TransactionDateGroupProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  group: TransactionDateGroupModel
  /** Today's date key, so today and yesterday read "Hôm nay" and "Hôm qua". */
  todayDateKey: string
}

/**
 * One day: its date and what it left you (money in less money out, as the
 * month's card counts them) as the caption, which stays at the top while the
 * day's rows scroll, then its transactions as rows.
 */
export function TransactionDateGroup({
  accounts,
  categoryGroups,
  group,
  todayDateKey,
}: TransactionDateGroupProps) {
  const { income, expense, netBalance } = getTransactionSummary(group.transactions)

  return (
    <SettingsGroup
      stickyCaption
      title={
        <time dateTime={group.dateKey}>{formatDayLabel(group.dateKey, todayDateKey)}</time>
      }
      action={
        income > 0 || expense > 0 ? (
          <span
            className={cn(
              "shrink-0 text-xs font-medium tabular-nums",
              netBalance > 0 ? cashFlowColors.income.text : "text-muted-foreground",
            )}
          >
            {netBalance > 0 ? "+" : netBalance < 0 ? "−" : ""}
            {formatCurrency(netBalance, { signDisplay: "never" })}
          </span>
        ) : undefined
      }
    >
      {group.transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          accounts={accounts}
          categoryGroups={categoryGroups}
          transaction={transaction}
        />
      ))}
    </SettingsGroup>
  )
}
