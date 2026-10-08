"use client"

import * as React from "react"

import { Money } from "@/components/app/money"
import { SettingsRow } from "@/components/settings-list"
import { Sheet } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatTime } from "@/lib/format-date"

import { findMatch } from "../_lib/find-match"
import { getTransactionVisual } from "../_lib/transaction-presentation"
import type { Transaction } from "../_types/transaction"
import { EditTransactionSheet } from "./edit-transaction-sheet"
import { TransactionDetailsSheet } from "./transaction-details-sheet"

type TransactionItemProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transaction: Transaction
  /** In search results, which are not grouped by day: the day, in place of the time. */
  dateLabel?: string
  /** The search text, marked where it appears in the title. */
  highlight?: string
}

/** The title with the searched text marked, as search results do in native apps. */
function MarkedTitle({ title, query }: { title: string; query?: string }) {
  const match = query ? findMatch(title, query) : null
  if (!match) return title
  return (
    <>
      {title.slice(0, match.start)}
      <mark className="rounded-[3px] bg-warning/25 text-inherit">{title.slice(match.start, match.end)}</mark>
      {title.slice(match.end)}
    </>
  )
}

export function TransactionItem({
  accounts,
  categoryGroups,
  transaction,
  dateLabel,
  highlight,
}: TransactionItemProps) {
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const { category, icon, color } = getTransactionVisual(transaction, categoryGroups)

  return (
    <>
      <SettingsRow
        icon={icon}
        tone={color}
        title={<MarkedTitle title={transaction.title} query={highlight} />}
        // The account; the icon already shows the category's group.
        description={
          transaction.kind === "transfer"
            ? transaction.description
            : (transaction.accountName ?? transaction.description)
        }
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
              <Money
                amount={transaction.kind === "expense" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount)}
                sign={transaction.kind === "transfer" ? "never" : "always"}
                size="sm"
                // Only money coming in is coloured, as in the mockup.
                tone={transaction.kind === "income" ? "income" : "default"}
              />
              <time
                className="text-xs text-muted-foreground"
                dateTime={transaction.occurredAt}
              >
                {dateLabel ?? formatTime(transaction.occurredAt)}
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
