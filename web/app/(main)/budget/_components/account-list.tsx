"use client"

import * as React from "react"
import { PlusIcon, WalletCardsIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsRow, groupCaptionClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
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
import { AddCard } from "./add-card"
import { AddAccountSheet } from "./add-account/add-account-sheet"
import { JarList } from "./savings/jar-section"

type AccountListProps = {
  accounts: Account[]
  recentTransactions: Record<string, Transaction[]>
  /** This month's money in and out of each account. */
  flows: Record<string, AccountFlow>
  /** The month `flows` covers, e.g. "Tháng 10". */
  monthLabel: string
  categoryGroups: CategoryGroup[]
  /** An account whose sheet opens straight away (a notice about it). */
  initialOpenId?: string
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

export function AccountList({ accounts, recentTransactions, flows, monthLabel, categoryGroups, initialOpenId }: AccountListProps) {
  const [openAccountId, setOpenAccountId] = React.useState<string | null>(initialOpenId ?? null)
  // Adding an account: the last row of "Tài khoản chính" on phones, as "Thêm hũ" is under the jars.
  const [adding, setAdding] = React.useState(false)
  // Every account in use in one list, largest balance first, those left out
  // of the figures among them (still used, only not counted), marked so.
  // Savings jars are accounts too, listed in groups of their own.
  const jars = accounts.filter((account) => account.type === "savings")
  const activeAccounts = accounts
    .filter((account) => account.status === "active" && account.type !== "savings")
    .sort((left, right) => right.balance - left.balance)
  const archivedAccounts = accounts.filter((account) => account.status === "archived" && account.type !== "savings")
  // A deleted account closes its sheet.
  const openAccount = accounts.find((account) => account.id === openAccountId && account.type !== "savings")

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
          <EmptyContent>
            <Button type="button" onClick={() => setAdding(true)}>
              <PlusIcon />
              Thêm tài khoản
            </Button>
          </EmptyContent>
        </Empty>
        <AddAccountSheet open={adding} onOpenChange={setAdding} />
      </Card>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* "Tài khoản chính" (2026-10-14, was "Đang dùng"), "Hũ tiết kiệm" and "Đã khoá" below it. A list on
          phones, ending with "Thêm tài khoản" (also when every account is locked); from lg up a grid of
          cards with this month's in and out, so the page uses its width, the last a dashed card to add one. */}
      <div className="lg:hidden">
        <SettingsGroup title={activeAccounts.length ? `Tài khoản chính · ${activeAccounts.length}` : "Tài khoản chính"}>
          {activeAccounts.map((account) => (
            <AccountRow key={account.id} account={account} onSelect={() => setOpenAccountId(account.id)} />
          ))}
          <SettingsRow
            media={<IconTile icon={PlusIcon} tone="neutral" size="sm" />}
            title="Thêm tài khoản"
            chevron={false}
            onClick={() => setAdding(true)}
          />
        </SettingsGroup>
      </div>
      <section className="hidden flex-col gap-2 lg:flex">
        <h2 className={cn("px-4", groupCaptionClassName)}>
          {activeAccounts.length ? `Tài khoản chính · ${activeAccounts.length}` : "Tài khoản chính"}
        </h2>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {activeAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              flow={flows[account.id]}
              onSelect={() => setOpenAccountId(account.id)}
            />
          ))}
          <AddCard label="Thêm tài khoản" onClick={() => setAdding(true)} />
        </div>
      </section>

      {/* The savings jars under the accounts in use, the locked accounts and finished jars after them. */}
      <JarList jars={jars} accounts={accounts} recentTransactions={recentTransactions} categoryGroups={categoryGroups} part="open" initialOpenId={initialOpenId} />

      {archivedAccounts.length > 0 ? (
        <>
          {/* Folded by default; a list on phones, from lg up cards the size
              of those in use, as the group above them. */}
          <div className="lg:hidden">
            <SettingsGroup
              // Opened again once the last account in use is locked, not only on the next visit.
              key={activeAccounts.length === 0 ? "open" : "folded"}
              title="Đã khoá"
              collapsible={{ showLabel: `Hiện ${archivedAccounts.length} tài khoản`, defaultOpen: activeAccounts.length === 0 }}
            >
              {archivedAccounts.map((account) => (
                <AccountRow key={account.id} account={account} onSelect={() => setOpenAccountId(account.id)} />
              ))}
            </SettingsGroup>
          </div>
          <div className="hidden lg:block">
            <SettingsGroup
              key={activeAccounts.length === 0 ? "open" : "folded"}
              plain
              title="Đã khoá"
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

      <JarList jars={jars} accounts={accounts} recentTransactions={recentTransactions} categoryGroups={categoryGroups} part="done" initialOpenId={initialOpenId} />

      <AddAccountSheet open={adding} onOpenChange={setAdding} />

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
