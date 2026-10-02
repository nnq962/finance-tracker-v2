"use client"

import * as React from "react"
import { HandCoinsIcon } from "lucide-react"

import { SettingsRow } from "@/components/settings-list"
import { Sheet } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatTime } from "@/lib/format-date"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

import { transactionPresentation } from "../_lib/transaction-presentation"
import type { Transaction } from "../_types/transaction"
import { EditTransactionSheet } from "./edit-transaction-sheet"
import { TransactionDetailsSheet } from "./transaction-details-sheet"

const amountSigns = { expense: "−", income: "+", transfer: "" } as const

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
  const category = transaction.categoryId
    ? categoryGroups
        .find((group) => group.id === transaction.categoryGroupId)
        ?.items.find((item) => item.id === transaction.categoryId) ??
      categoryGroups
        .flatMap((group) => group.items)
        .find((item) => item.id === transaction.categoryId)
    : undefined
  // The category's own icon and colour; loans, transfers and unknown
  // categories fall back to an icon for their kind.
  const icon = category
    ? categoryIconRegistry[category.iconName]
    : transaction.source === "debt"
      ? HandCoinsIcon
      : presentation.icon
  const color = category
    ? category.colorName
    : transaction.kind === "transfer"
      ? "blue"
      : transaction.kind === "income"
        ? "emerald"
        : "rose"

  return (
    <>
      <SettingsRow
        icon={icon}
        color={color}
        title={transaction.title}
        description={transaction.description}
        chevron={false}
        onClick={() => setDetailsOpen(true)}
        action={
          <span className="flex items-center gap-6">
            {transaction.note ? (
              // Only where the list is a wide container: the transactions
              // page on desktop, not a phone or the overview's day sheet.
              <span className="hidden max-w-64 truncate text-sm text-muted-foreground @2xl:block">
                {transaction.note}
              </span>
            ) : null}
            <span className="flex flex-col items-end">
              <span
                className={cn(
                  "font-heading text-sm font-extrabold tabular-nums",
                  presentation.amountClassName,
                )}
              >
                {amountSigns[transaction.kind]}
                {formatCurrency(Math.abs(transaction.amount), {
                  signDisplay: "never",
                })}
              </span>
              <time
                className="text-xs text-muted-foreground"
                dateTime={transaction.occurredAt}
              >
                {formatTime(transaction.occurredAt)}
              </time>
            </span>
          </span>
        }
      />

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
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
