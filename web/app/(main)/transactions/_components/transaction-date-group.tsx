import { SettingsGroup } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDayLabel } from "@/lib/format-date"

import { TransactionItem } from "./transaction-item"

import { cashFlowColors } from "../_lib/transaction-presentation"
import type { TransactionDateGroup as TransactionDateGroupModel } from "../_types/transaction"

type TransactionDateGroupProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  group: TransactionDateGroupModel
  /** Today's date key, so today and yesterday read "Hôm nay" and "Hôm qua". */
  todayDateKey: string
}

/** One day: its date and totals as the caption, then its transactions as rows. */
export function TransactionDateGroup({
  accounts,
  categoryGroups,
  group,
  todayDateKey,
}: TransactionDateGroupProps) {
  const income = group.transactions.reduce(
    (total, transaction) =>
      transaction.kind === "income" && !transaction.source
        ? total + Math.abs(transaction.amount)
        : total,
    0,
  )
  const expense = group.transactions.reduce(
    (total, transaction) =>
      transaction.kind === "expense" && !transaction.source
        ? total + Math.abs(transaction.amount)
        : total,
    0,
  )

  return (
    <SettingsGroup
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
