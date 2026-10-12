"use client"

import * as React from "react"
import { WalletCardsIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsRow, groupCaptionClassName } from "@/components/settings-list"
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
import { cn } from "@/lib/utils"

import { AccountCard } from "./account-card"
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
  // Left out of the figures: its balance is not in the total, so it greys.
  const isLocked = account.excluded

  return (
    <SettingsRow
      media={<AccountLogo account={account} />}
      title={account.name}
      // Still used, only not counted ("Ngoài báo cáo"): said first, so a long kind cannot cut it off; its balance grey.
      description={[account.excluded ? "Ngoài báo cáo" : null, accountDescription(account)].filter(Boolean).join(" · ") || undefined}
      action={
        <Money
          amount={account.balance}
          size="sm"
          // Below zero is a warning; a balance outside the total greys.
          tone={isLocked ? "muted" : account.balance < 0 ? "expense" : "default"}
        />
      }
      onClick={onSelect}
    />
  )
}

export function AccountList({ accounts, recentTransactions, flows, monthLabel, categoryGroups }: AccountListProps) {
  const [openAccountId, setOpenAccountId] = React.useState<string | null>(null)
  // Every account in use in one list, largest balance first, those left out
  // of the figures among them (still used, only not counted), marked so.
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
        <>
          {/* Named like the "Ngừng sử dụng" group below it. A list on phones;
              from lg up a grid of cards with this month's in and out, so the
              page uses its width. */}
          <div className="lg:hidden">
            <SettingsGroup title={`Đang dùng · ${activeAccounts.length}`}>
              {activeAccounts.map((account) => (
                <AccountRow key={account.id} account={account} onSelect={() => setOpenAccountId(account.id)} />
              ))}
            </SettingsGroup>
          </div>
          <section className="hidden flex-col gap-2 lg:flex">
            <h2 className={cn("px-4", groupCaptionClassName)}>Đang dùng · {activeAccounts.length}</h2>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {activeAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  flow={flows[account.id]}
                  onSelect={() => setOpenAccountId(account.id)}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {archivedAccounts.length > 0 ? (
        <>
          {/* Folded by default; a list on phones, from lg up cards the size
              of those in use, as the group above them. */}
          <div className="lg:hidden">
            <SettingsGroup
              title="Ngừng sử dụng"
              collapsible={{ showLabel: `Hiện ${archivedAccounts.length} tài khoản`, defaultOpen: activeAccounts.length === 0 }}
            >
              {archivedAccounts.map((account) => (
                <AccountRow key={account.id} account={account} onSelect={() => setOpenAccountId(account.id)} />
              ))}
            </SettingsGroup>
          </div>
          <div className="hidden lg:block">
            <SettingsGroup
              plain
              title="Ngừng sử dụng"
              collapsible={{ showLabel: `Hiện ${archivedAccounts.length} tài khoản`, defaultOpen: activeAccounts.length === 0 }}
            >
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {archivedAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    flow={flows[account.id]}
                    onSelect={() => setOpenAccountId(account.id)}
                  />
                ))}
              </div>
            </SettingsGroup>
          </div>
        </>
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
