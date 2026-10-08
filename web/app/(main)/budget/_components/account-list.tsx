"use client"

import * as React from "react"
import { WalletCardsIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { accountTypeLabels } from "@/lib/accounts/labels"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { AccountSheet } from "./account-sheet"

type AccountListProps = {
  accounts: Account[]
  recentTransactions: Record<string, Transaction[]>
  categoryGroups: CategoryGroup[]
}

/** The type, and the bank or wallet, leaving out what the name already says. */
function accountDescription(account: Account) {
  const type = accountTypeLabels[account.type]
  if (account.institutionName && account.institutionName !== account.name) return `${type} · ${account.institutionName}`
  return type === account.name ? undefined : type
}

function AccountRow({ account, onSelect }: { account: Account; onSelect: () => void }) {
  const isLocked = account.status === "archived"

  return (
    <SettingsRow
      media={<AccountLogo account={account} />}
      title={account.name}
      description={accountDescription(account)}
      action={
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            isLocked ? "text-muted-foreground" : account.balance < 0 && "text-expense",
          )}
        >
          {formatCurrency(account.balance)}
        </span>
      }
      onClick={onSelect}
    />
  )
}

export function AccountList({ accounts, recentTransactions, categoryGroups }: AccountListProps) {
  const [openAccountId, setOpenAccountId] = React.useState<string | null>(null)
  // One list, largest balance first.
  const activeAccounts = accounts
    .filter((account) => account.status === "active")
    .sort((left, right) => right.balance - left.balance)
  const archivedAccounts = accounts.filter((account) => account.status === "archived")
  // A deleted account closes its sheet.
  const openAccount = accounts.find((account) => account.id === openAccountId)

  if (accounts.length === 0) {
    return (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WalletCardsIcon />
            </EmptyMedia>
            <EmptyTitle>Chưa có tài khoản</EmptyTitle>
            <EmptyDescription>Thêm tài khoản đầu tiên để bắt đầu.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {activeAccounts.length > 0 ? (
        // Named like the "Ngừng sử dụng" group below it.
        <SettingsGroup title={`Đang dùng · ${activeAccounts.length}`}>
          {activeAccounts.map((account) => (
            <AccountRow key={account.id} account={account} onSelect={() => setOpenAccountId(account.id)} />
          ))}
        </SettingsGroup>
      ) : null}

      {archivedAccounts.length > 0 ? (
        <SettingsGroup
          title="Ngừng sử dụng"
          footer="Không tính vào tổng số dư"
          collapsible={{ showLabel: `Hiện ${archivedAccounts.length} tài khoản`, defaultOpen: activeAccounts.length === 0 }}
        >
          {archivedAccounts.map((account) => (
            <AccountRow key={account.id} account={account} onSelect={() => setOpenAccountId(account.id)} />
          ))}
        </SettingsGroup>
      ) : null}

      <AccountSheet
        account={openAccount}
        transactions={openAccount ? recentTransactions[openAccount.id] ?? [] : []}
        categoryGroups={categoryGroups}
        onOpenChange={(open) => {
          if (!open) setOpenAccountId(null)
        }}
      />
    </div>
  )
}
