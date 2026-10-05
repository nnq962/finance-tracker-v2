import { SettingsGroup } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"

import { TransactionItem } from "./transaction-item"

import { cashFlowColors } from "../_lib/transaction-presentation"
import type { TransactionDateGroup as TransactionDateGroupModel } from "../_types/transaction"

type TransactionDateGroupProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  group: TransactionDateGroupModel
  isToday: boolean
}

/** One day: its date and totals as the caption, then its transactions as rows. */
export function TransactionDateGroup({
  accounts,
  categoryGroups,
  group,
  isToday,
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
      plain
      title={
        <time dateTime={group.dateKey}>
          {isToday ? "Hôm nay" : group.weekdayLabel}, {group.dateLabel}
        </time>
      }
      action={
        income > 0 || expense > 0 ? (
          <span className="flex shrink-0 items-center gap-2 font-heading text-xs font-extrabold tabular-nums">
            {income > 0 ? (
              <span className={cashFlowColors.income.text}>
                +{formatCurrency(income, { signDisplay: "never" })}
              </span>
            ) : null}
            {expense > 0 ? (
              <span className={cashFlowColors.expense.text}>
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
