"use client"

import { Section } from "@/components/app/section-header"
import { SettingsGroup } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatShortDate, formatTime, toDateKey } from "@/lib/format-date"

import { TransactionItem } from "../../transactions/_components/transaction-item"
import type { Transaction } from "../../transactions/_types/transaction"

/** "Hôm nay · 14:05", "Hôm qua · 00:02", "16/10 · 10:59": the rows span a few days. */
function whenLabel(occurredAt: string | Date, today: string) {
  const day = toDateKey(occurredAt)
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
  const name = day === today ? "Hôm nay" : day === yesterday ? "Hôm qua" : formatShortDate(day)
  return `${name} · ${formatTime(occurredAt)}`
}

/**
 * Giao dịch gần đây (2026-10-25, the overview mockup): the last few, newest
 * first, each the row of Giao dịch (a tap opens it) with its day before the
 * time; "Xem tất cả" goes to Giao dịch. Nothing yet, no section.
 */
export function RecentTransactions({
  transactions,
  accounts,
  categoryGroups,
  today,
}: {
  transactions: Transaction[]
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  /** "YYYY-MM-DD" in Vietnam time. */
  today: string
}) {
  if (transactions.length === 0) return null
  return (
    <Section title="Giao dịch gần đây" href="/transactions">
      <SettingsGroup>
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            accounts={accounts}
            categoryGroups={categoryGroups}
            transaction={transaction}
            dateLabel={whenLabel(transaction.occurredAt, today)}
          />
        ))}
      </SettingsGroup>
    </Section>
  )
}
