"use client"

import * as React from "react"

import { SettingsGroup } from "@/components/settings-list"
import { Skeleton } from "@/components/ui/skeleton"
import { loadBudgetSpendingAction, type BudgetSpending } from "@/lib/budgets/actions"
import { formatCurrency } from "@/lib/format-currency"
import { formatDayLabel, toDateKey } from "@/lib/format-date"
import type { Transaction } from "@/lib/transactions/types"

import { TransactionItem } from "@/app/(main)/transactions/_components/transaction-item"

/**
 * A month's spending in some groups or one category, as the limits count
 * it, listed inside the limits sheet (2026-10-17, so looking at "Ăn uống"
 * or "Ăn trưa" no longer leaves for the transactions page and back): how
 * many and how much, then the transactions by day, newest first; a tap
 * opens one, to see, change or delete it, as on the transactions page.
 * Loaded again when `version` changes (a transaction or limit changed).
 */
export function BudgetSpendingList({
  month,
  filter,
  today,
  version,
}: {
  /** "YYYY-MM". */
  month: string
  filter: { groupIds?: string[]; itemId?: string }
  today: string
  version: string
}) {
  const key = `${month}|${filter.itemId ?? ""}|${(filter.groupIds ?? []).join(",")}|${version}`
  const [loaded, setLoaded] = React.useState<{ key: string; data: BudgetSpending | null } | null>(null)
  const data = loaded?.key === key ? loaded.data : undefined

  React.useEffect(() => {
    let live = true
    void loadBudgetSpendingAction(month, filter).then((result) => {
      if (live) setLoaded({ key, data: result })
    })
    return () => {
      live = false
    }
    // The filter is part of the key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (data === undefined) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-label="Đang tải giao dịch">
        <Skeleton className="mx-4 h-3 w-32" />
        <Skeleton className="h-48 w-full rounded-[20px]" />
      </div>
    )
  }
  if (data === null) return <p className="px-4 text-sm text-muted-foreground">Không tải được giao dịch. Vui lòng thử lại.</p>
  if (data.transactions.length === 0) return <p className="px-4 text-sm text-muted-foreground">Chưa có khoản chi</p>

  const total = data.transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
  const days = new Map<string, Transaction[]>()
  for (const transaction of data.transactions) {
    const day = toDateKey(transaction.occurredAt)
    days.set(day, [...(days.get(day) ?? []), transaction])
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {data.transactions.length} giao dịch · <span className="font-medium text-foreground tabular-nums">{formatCurrency(total)}</span>
      </p>
      {[...days].map(([day, transactions]) => (
        // Each day a card of rows, as every list in a sheet (2026-10-25; flat as the page's days before).
        <SettingsGroup
          key={day}
          plainCaption
          title={<time dateTime={day}>{formatDayLabel(day, today)}</time>}
          action={
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              −{formatCurrency(transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0), { signDisplay: "never" })}
            </span>
          }
        >
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              accounts={data.accounts}
              categoryGroups={data.categoryGroups}
              transaction={transaction}
            />
          ))}
        </SettingsGroup>
      ))}
    </div>
  )
}
