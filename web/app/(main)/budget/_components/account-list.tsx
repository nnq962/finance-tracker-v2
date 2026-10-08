"use client"

import * as React from "react"
import { WalletCardsIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { accountDescription } from "@/lib/accounts/labels"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { AccountFlow, Transaction } from "@/lib/transactions/types"

import { AccountSheet } from "./account-sheet"

type AccountListProps = {
  accounts: Account[]
  recentTransactions: Record<string, Transaction[]>
  /** This month's money in and out of each account. */
  flows: Record<string, AccountFlow>
  /** The month `flows` covers, e.g. "Tháng 10". */
  monthLabel: string
  categoryGroups: CategoryGroup[]
}

function AccountRow({ account, onSelect }: { account: Account; onSelect: () => void }) {
  const isLocked = account.status === "archived"

  return (
    <SettingsRow
      media={<AccountLogo account={account} />}
      title={account.name}
      description={accountDescription(account)}
      action={
        <Money
          amount={account.balance}
          size="sm"
          // Below zero is a warning; an archived account's balance no longer counts.
          tone={isLocked ? "muted" : account.balance < 0 ? "expense" : "default"}
        />
      }
      onClick={onSelect}
    />
  )
}

export function AccountList({ accounts, recentTransactions, flows, monthLabel, categoryGroups }: AccountListProps) {
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
        accounts={accounts}
        transactions={openAccount ? recentTransactions[openAccount.id] ?? [] : []}
        flow={openAccount ? flows[openAccount.id] : undefined}
        monthLabel={monthLabel}
        categoryGroups={categoryGroups}
        onOpenChange={(open) => {
          if (!open) setOpenAccountId(null)
        }}
      />
    </div>
  )
}
