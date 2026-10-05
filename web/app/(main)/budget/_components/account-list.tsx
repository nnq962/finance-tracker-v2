"use client"

import * as React from "react"
import { ChevronDownIcon, WalletCardsIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getAccountDistribution } from "@/lib/accounts/distribution"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { AccountSheet, getAccountKind } from "./account-sheet"

type AccountListProps = {
  accounts: Account[]
  recentTransactions: Record<string, Transaction[]>
  categoryGroups: CategoryGroup[]
}

type AccountShare = { percentageLabel: string }

function AccountRow({
  account,
  share,
  grouped = false,
  onSelect,
}: {
  account: Account
  share?: AccountShare
  /** Under its type's caption, where only the bank or wallet adds anything. */
  grouped?: boolean
  onSelect: () => void
}) {
  const isLocked = account.status === "archived"

  return (
    <SettingsRow
      media={<AccountLogo account={account} className="size-8" />}
      title={account.name}
      description={grouped ? account.institutionName : getAccountKind(account)}
      action={
        <span className="flex flex-col items-end">
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              isLocked
                ? "text-muted-foreground"
                : account.balance < 0 && "text-expense",
            )}
          >
            {formatCurrency(account.balance)}
          </span>
          {share ? (
            <span className="text-xs text-muted-foreground">
              {share.percentageLabel}
            </span>
          ) : null}
        </span>
      }
      onClick={onSelect}
    />
  )
}

export function AccountList({ accounts, recentTransactions, categoryGroups }: AccountListProps) {
  const [openAccountId, setOpenAccountId] = React.useState<string | null>(null)
  // Grouped by type, largest total first, the same order as the bar.
  const { distribution, groups } = getAccountDistribution(accounts)
  const archivedAccounts = accounts.filter((account) => account.status === "archived")
  // A deleted account closes its sheet.
  const openAccount = accounts.find((account) => account.id === openAccountId)
  const openShare = distribution.find((account) => account.id === openAccountId)

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
    <div className="space-y-6">
      {groups.map((group) => (
        <SettingsGroup
          key={group.type}
          title={group.label}
          action={
            <span className="shrink-0 text-xs font-semibold tabular-nums">
              {formatCurrency(group.total)}
            </span>
          }
        >
          {group.accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              share={account}
              grouped
              onSelect={() => setOpenAccountId(account.id)}
            />
          ))}
        </SettingsGroup>
      ))}

      {archivedAccounts.length > 0 ? (
        <Collapsible defaultOpen={distribution.length === 0}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="group/archived">
              Ngừng sử dụng
              <Badge variant="outline">{archivedAccounts.length}</Badge>
              <ChevronDownIcon
                className="transition-transform group-data-[state=open]/archived:rotate-180"
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <SettingsGroup footer="Không tính vào tổng số dư">
              {archivedAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onSelect={() => setOpenAccountId(account.id)}
                />
              ))}
            </SettingsGroup>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <AccountSheet
        account={openAccount}
        share={openShare}
        transactions={openAccount ? recentTransactions[openAccount.id] ?? [] : []}
        categoryGroups={categoryGroups}
        onOpenChange={(open) => {
          if (!open) setOpenAccountId(null)
        }}
      />
    </div>
  )
}
