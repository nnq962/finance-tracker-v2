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

/** One day: its date and totals as a sticky header, then its transactions as rows. */
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

  const titleId = `transactions-${group.dateKey}`

  return (
    <section aria-labelledby={titleId}>
      {/* A section header that sticks while its day scrolls by, as in a
          phone's list. On phones it runs edge to edge and covers the status
          bar's strip above it; from md up it sits under the app's header. */}
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-10 mx-[calc(var(--main-content-px)*-1)] flex min-h-9 items-center justify-between gap-3 bg-[#f3f1ec]/90 px-(--main-content-px) py-1.5 backdrop-blur-md before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top,0px)] before:bg-[#fbfaf7] dark:bg-[#1b1a21]/90 dark:before:bg-background md:top-16 md:before:hidden lg:mx-0 lg:rounded-lg lg:px-3">
        <h2 id={titleId} className="min-w-0 truncate text-[13px] font-semibold text-muted-foreground">
          <time dateTime={group.dateKey}>
            {isToday ? "Hôm nay" : group.weekdayLabel}, {group.dateLabel}
          </time>
        </h2>
        {income > 0 || expense > 0 ? (
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
        ) : null}
      </header>
      <ul className="mx-[calc(var(--main-content-px)*-1)] bg-white dark:bg-card lg:mx-0 lg:bg-transparent lg:py-1 dark:lg:bg-transparent">
        {group.transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            accounts={accounts}
            categoryGroups={categoryGroups}
            transaction={transaction}
            native
          />
        ))}
      </ul>
    </section>
  )
}
