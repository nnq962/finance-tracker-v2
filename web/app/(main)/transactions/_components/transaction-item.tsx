"use client"

import * as React from "react"

import { SettingsRow } from "@/components/settings-list"
import { Sheet } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { getCategoryColor } from "@/lib/categories/category-colors"
import { formatCurrency } from "@/lib/format-currency"
import { formatTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"

import { getTransactionVisual, transactionPresentation } from "../_lib/transaction-presentation"
import type { Transaction } from "../_types/transaction"
import { EditTransactionSheet } from "./edit-transaction-sheet"
import { TransactionDetailsSheet } from "./transaction-details-sheet"

const amountSigns = { expense: "−", income: "+", transfer: "" } as const

type TransactionItemProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transaction: Transaction
  /**
   * A phone app's row: a round icon, the row edge to edge on phones and a
   * hairline between rows. Otherwise a settings row, for grouped cards.
   */
  native?: boolean
}

export function TransactionItem({
  accounts,
  categoryGroups,
  transaction,
  native = false,
}: TransactionItemProps) {
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const presentation = transactionPresentation[transaction.kind]
  const { category, icon: Icon, color } = getTransactionVisual(transaction, categoryGroups)
  // The account; the icon already shows the category's group.
  const description =
    transaction.kind === "transfer"
      ? transaction.description
      : (transaction.accountName ?? transaction.description)
  const note = transaction.note ? (
    // Only where the list is a wide container: the transactions page on
    // desktop, not a phone or the overview's day sheet.
    <span className="hidden max-w-64 truncate text-sm text-muted-foreground @2xl:block">
      {transaction.note}
    </span>
  ) : null
  const amount = (
    <span className="flex flex-col items-end">
      <span
        className={cn(
          "font-heading font-extrabold tabular-nums",
          native ? "text-[15px]" : "text-sm",
          presentation.amountClassName,
        )}
      >
        {amountSigns[transaction.kind]}
        {formatCurrency(Math.abs(transaction.amount), {
          signDisplay: "never",
        })}
      </span>
      <time className="text-xs text-muted-foreground" dateTime={transaction.occurredAt}>
        {formatTime(transaction.occurredAt)}
      </time>
    </span>
  )

  return (
    <>
      {native ? (
        // Hairline between rows from where the text starts: page padding
        // (16px) + icon (40px) + gap (12px) on phones, 12px padding from lg.
        <li className="relative before:absolute before:top-0 before:right-0 before:left-[calc(var(--main-content-px)+3.25rem)] before:h-px before:bg-[#e7e4dd] first:before:hidden dark:before:bg-[#35323e] lg:before:left-16">
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="flex min-h-16 w-full items-center gap-3 px-(--main-content-px) py-2.5 text-left outline-none transition-colors focus-visible:bg-[#d6f4ff] active:bg-[#f3f1ec] dark:focus-visible:bg-[#113950] dark:active:bg-[#2c2a33] lg:rounded-xl lg:px-3 lg:hover:bg-[#f3f1ec] dark:lg:hover:bg-[#2c2a33]"
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                getCategoryColor(color).surfaceClassName,
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{transaction.title}</span>
              {description ? (
                <span className="block truncate text-[13px] text-muted-foreground">{description}</span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-6">
              {note}
              {amount}
            </span>
          </button>
        </li>
      ) : (
        <SettingsRow
          icon={Icon}
          color={color}
          title={transaction.title}
          description={description}
          chevron={false}
          onClick={() => setDetailsOpen(true)}
          action={
            <span className="flex items-center gap-6">
              {note}
              {amount}
            </span>
          }
        />
      )}

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
