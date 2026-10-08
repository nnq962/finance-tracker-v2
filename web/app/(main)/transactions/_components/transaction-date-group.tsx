import { SettingsGroup } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDayLabel } from "@/lib/format-date"

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
 * One day: its date and its money in and out (as the month's card counts
 * them) as the caption, which stays at the top while the day's rows scroll,
 * then its transactions as rows.
 */
export function TransactionDateGroup({
  accounts,
  categoryGroups,
  group,
  todayDateKey,
}: TransactionDateGroupProps) {
  const { income, expense } = getTransactionSummary(group.transactions)

  return (
    <SettingsGroup
      stickyCaption
      title={
        <time dateTime={group.dateKey}>{formatDayLabel(group.dateKey, todayDateKey)}</time>
      }
      action={
        income > 0 || expense > 0 ? (
          <span className="flex shrink-0 items-center gap-2 text-xs font-medium tabular-nums">
            {income > 0 ? (
              <span className={cashFlowColors.income.text}>
                +{formatCurrency(income, { signDisplay: "never" })}
              </span>
            ) : null}
            {expense > 0 ? (
              <span className="text-muted-foreground">
                −{formatCurrency(expense, { signDisplay: "never" })}
              </span>
            ) : null}
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
