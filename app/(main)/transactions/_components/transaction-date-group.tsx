import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"

import { TransactionItem } from "./transaction-item"

import type { TransactionDateGroup as TransactionDateGroupModel } from "../_types/transaction"

type TransactionDateGroupProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  group: TransactionDateGroupModel
}

export function TransactionDateGroup({
  accounts,
  categoryGroups,
  group,
}: TransactionDateGroupProps) {
  const income = group.transactions.reduce(
    (total, transaction) =>
      transaction.kind === "income"
        ? total + Math.abs(transaction.amount)
        : total,
    0,
  )
  const expense = group.transactions.reduce(
    (total, transaction) =>
      transaction.kind === "expense"
        ? total + Math.abs(transaction.amount)
        : total,
    0,
  )

  return (
    <section className="relative pl-8 sm:pl-10">
      <span
        className="absolute top-1.5 left-0 z-10 size-4 rounded-full border-2 border-foreground bg-background"
        aria-hidden="true"
      />

      <div className="flex min-h-10 items-start justify-between gap-4">
        <h2 className="shrink-0">
          <span className="block text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {group.weekdayLabel}
          </span>
          <time
            className="block text-lg leading-tight font-semibold tabular-nums"
            dateTime={group.dateKey}
          >
            {group.dateLabel}
          </time>
        </h2>

        {income > 0 || expense > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5 text-sm font-semibold tabular-nums">
            {income > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(income, { signDisplay: "always" })}
              </span>
            ) : null}
            {income > 0 && expense > 0 ? (
              <span className="text-muted-foreground" aria-hidden="true">
                ·
              </span>
            ) : null}
            {expense > 0 ? (
              <span className="text-rose-600 dark:text-rose-400">
                {formatCurrency(-expense)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <Card size="sm" className="mt-3">
        <CardContent className="-my-3">
          {group.transactions.map((transaction, index) => (
            <div key={transaction.id}>
              {index > 0 ? <Separator /> : null}
              <TransactionItem
                accounts={accounts}
                categoryGroups={categoryGroups}
                transaction={transaction}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
