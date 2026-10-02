import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  showConnector: boolean
}

export function TransactionDateGroup({
  accounts,
  categoryGroups,
  group,
  isToday,
  showConnector,
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
    <section className="relative mb-[26px] pl-[38px] last:mb-0">
      <span
        className={`absolute top-[22px] left-[11px] border-l-[3px] border-dashed border-[#d9d5cc] dark:border-[#4a4656] ${showConnector ? "bottom-[-30px]" : "bottom-0"}`}
        aria-hidden="true"
      />
      <span
        className={`absolute top-0.5 left-0 z-10 size-[25px] rounded-full border-[3px] ${isToday ? "border-[#d98b09] bg-[#fdc436] ring-4 ring-[#fff0c5] dark:ring-[#4b3711]" : "border-[#d9d5cc] bg-white dark:border-[#4a4656] dark:bg-card"}`}
        aria-hidden="true"
      />

      <div className="mb-3 flex min-h-[27px] flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-[3px]">
        <h2>
          <time
            className="font-heading text-xs font-extrabold uppercase tracking-[0.04em] text-muted-foreground"
            dateTime={group.dateKey}
          >
            {group.weekdayLabel}, {group.dateLabel}
          </time>
        </h2>

        {income > 0 || expense > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-2 font-heading text-xs font-extrabold tabular-nums">
            {income > 0 ? (
              <span className={cashFlowColors.income.text}>
                {formatCurrency(income, { signDisplay: "never" })}
              </span>
            ) : null}
            {income > 0 && expense > 0 ? (
              <span
                className="size-1 rounded-full bg-muted-foreground/40"
                aria-hidden="true"
              />
            ) : null}
            {expense > 0 ? (
              <span className={cashFlowColors.expense.text}>
                {formatCurrency(expense, { signDisplay: "never" })}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <Card size="sm">
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
