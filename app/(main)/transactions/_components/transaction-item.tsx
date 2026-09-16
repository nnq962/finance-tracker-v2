"use client"

import * as React from "react"

import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"

import { transactionPresentation } from "../_lib/transaction-presentation"
import type { Transaction } from "../_types/transaction"
import { EditTransactionSheet } from "./edit-transaction-sheet"
import { TransactionDetailsSheet } from "./transaction-details-sheet"

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
})

type TransactionItemProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transaction: Transaction
}

export function TransactionItem({
  accounts,
  categoryGroups,
  transaction,
}: TransactionItemProps) {
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const presentation = transactionPresentation[transaction.kind]
  const Icon = presentation.icon
  const category = transaction.categoryId
    ? categoryGroups
        .find((group) => group.id === transaction.categoryGroupId)
        ?.items.find((item) => item.id === transaction.categoryId) ??
      categoryGroups
        .flatMap((group) => group.items)
        .find((item) => item.id === transaction.categoryId)
    : undefined

  return (
    <>
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <article className="relative flex items-center gap-3 py-2.5 sm:gap-4">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${presentation.iconClassName}`}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">
              {transaction.title}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {transaction.description}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`text-sm font-semibold tabular-nums ${presentation.amountClassName}`}
            >
              {formatCurrency(Math.abs(transaction.amount), {
                signDisplay: "never",
              })}
            </p>
            <time
              className="text-sm text-muted-foreground"
              dateTime={transaction.occurredAt}
            >
              {timeFormatter.format(new Date(transaction.occurredAt))}
            </time>
          </div>

          <SheetTrigger asChild>
            <button
              type="button"
              className="absolute inset-0 cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              aria-label={`Xem chi tiết giao dịch ${transaction.title}`}
            />
          </SheetTrigger>
        </article>

        <TransactionDetailsSheet
          category={category}
          onDeleted={() => setDetailsOpen(false)}
          onEdit={() => {
            setDetailsOpen(false)
            setEditOpen(true)
          }}
          transaction={transaction}
        />
      </Sheet>

      <EditTransactionSheet
        accounts={accounts}
        categoryGroups={categoryGroups}
        onOpenChange={setEditOpen}
        open={editOpen}
        transaction={transaction}
      />
    </>
  )
}
