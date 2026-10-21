"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { AccountLogo } from "@/components/account-logo"
import { Money } from "@/components/app/money"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { accountDescription } from "@/lib/accounts/labels"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatDate, formatShortDate, toDateKey } from "@/lib/format-date"
import type { Transaction } from "@/lib/transactions/types"

import { TransactionHistoryProvider } from "../../transactions/_components/add-transaction/transaction-history-context"
import { TransactionItem } from "../../transactions/_components/transaction-item"
import { EditAccountSheet } from "./account-actions/edit-account-sheet"

/** How a transaction moved this account's balance: a transfer out also pays its fee. */
function getAccountAmount(transaction: Transaction, accountId: string) {
  if (transaction.kind !== "transfer") return transaction.amount
  return transaction.fromAccountId === accountId
    ? -(transaction.amount + (transaction.fee ?? 0))
    : transaction.amount
}

/** What a transaction was, the account going without saying: a transfer's other end, else its category's group. */
function getAccountDescription(transaction: Transaction, accountId: string) {
  if (transaction.kind === "transfer") {
    return transaction.fromAccountId === accountId
      ? `Đến ${transaction.toAccountName ?? "tài khoản khác"}`
      : `Từ ${transaction.fromAccountName ?? "tài khoản khác"}`
  }
  return transaction.categoryGroupName
}

type AccountSheetProps = {
  /** The account to show; none closes the sheet. */
  account?: Account
  /** Every account, for the transactions' sheets. */
  accounts: Account[]
  /** Its latest transactions. */
  transactions: Transaction[]
  /** For the transactions' category icons. */
  categoryGroups: CategoryGroup[]
  onOpenChange: (open: boolean) => void
}

/**
 * An account as the transaction's sheet shows one: its logo, name, balance
 * and kind (and since when) at the top, edited from the pencil in the bar; its
 * note; its latest transactions, each opening its own sheet. Locking
 * and deleting it are in its editor, behind the pencil.
 */
export function AccountSheet({
  account,
  accounts,
  transactions,
  categoryGroups,
  onOpenChange,
}: AccountSheetProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  // Keeps the last account on screen while the sheet slides closed.
  const [shown, setShown] = React.useState(account)
  if (account && account !== shown) setShown(account)

  if (!shown) return null

  const isLocked = shown.status === "archived"
  // Its kind, since when, and whether it is locked, in one line under the balance (2026-10-16: "Bắt đầu từ" was a card of its own).
  const subtitle = [accountDescription(shown), `từ ${formatDate(toDateKey(shown.openedAt))}`, isLocked ? "Đã khoá" : undefined]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <PageSheet
        title="Chi tiết tài khoản"
        open={account !== undefined}
        onOpenChange={onOpenChange}
        className="gap-6"
        action={
          // Also for a locked account: unlocking and deleting it are in the editor.
          <Button type="button" variant="secondary" size="icon" aria-label="Sửa tài khoản" onClick={() => setEditOpen(true)}>
            <PencilIcon />
          </Button>
        }
      >
        <div className="flex flex-col items-center pt-2 text-center">
          <AccountLogo account={shown} size="lg" />
          <p className="mt-3 max-w-full truncate text-base text-muted-foreground">{shown.name}</p>
          <Money
            amount={shown.balance}
            size="xl"
            tone={isLocked ? "muted" : shown.balance < 0 ? "expense" : "default"}
          />
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>

        {shown.note ? (
          <SettingsGroup>
            <SettingsRow title="Ghi chú" description={<span className="select-text">{shown.note}</span>} fullDescription />
          </SettingsGroup>
        ) : null}

        <SettingsGroup flat title="Giao dịch gần đây">
          {transactions.length > 0 ? (
            // What the transactions' sheets compare with and learn quick picks from.
            <TransactionHistoryProvider transactions={transactions}>
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  accounts={accounts}
                  categoryGroups={categoryGroups}
                  transaction={transaction}
                  description={getAccountDescription(transaction, shown.id)}
                  amount={getAccountAmount(transaction, shown.id)}
                  // The day alone: the balance after each ("· còn 593k") read as another amount (2026-10-16).
                  dateLabel={formatShortDate(toDateKey(transaction.occurredAt))}
                />
              ))}
              <SettingsRow
                title="Xem tất cả"
                onClick={() => router.push(`/transactions?account=${encodeURIComponent(shown.id)}`)}
              />
            </TransactionHistoryProvider>
          ) : (
            <SettingsRow title="Chưa có giao dịch" />
          )}
        </SettingsGroup>
        {/* Pushed into the account's sheet, ‹ back to it (2026-10-18). */}
        <EditAccountSheet account={shown} open={editOpen} onOpenChange={setEditOpen} onDeleted={() => onOpenChange(false)} />
      </PageSheet>
    </>
  )
}
