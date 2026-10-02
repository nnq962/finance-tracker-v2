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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getAccountDistribution } from "@/lib/accounts/distribution"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import type { Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { AccountSheet, getAccountKind } from "./account-sheet"
import { AddAccountButton } from "./add-account-button"

type AccountListProps = {
  accounts: Account[]
  recentTransactions: Record<string, Transaction[]>
}

type AccountShare = { fill: string; percentageLabel: string }

function AccountRow({
  account,
  share,
  onSelect,
}: {
  account: Account
  share?: AccountShare
  onSelect: () => void
}) {
  const isLocked = account.status === "archived"

  return (
    <SettingsRow
      media={<AccountLogo account={account} className="size-8" />}
      title={account.name}
      description={getAccountKind(account)}
      action={
        <span className="flex flex-col items-end">
          <span
            className={cn(
              "font-heading text-sm font-extrabold tabular-nums",
              isLocked && "text-muted-foreground",
            )}
          >
            {formatCurrency(account.balance)}
          </span>
          {share ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {/* The account's colour in the bar above. */}
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: share.fill }}
                aria-hidden="true"
              />
              {share.percentageLabel}
            </span>
          ) : null}
        </span>
      }
      onClick={onSelect}
    />
  )
}

export function AccountList({ accounts, recentTransactions }: AccountListProps) {
  const [openAccountId, setOpenAccountId] = React.useState<string | null>(null)
  // Largest balance first, the same order as the bar.
  const { distribution } = getAccountDistribution(accounts)
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
            <EmptyTitle>Bắt đầu với tài khoản đầu tiên</EmptyTitle>
            <EmptyDescription>
              Thêm tiền mặt, tài khoản ngân hàng hoặc ví điện tử để theo dõi
              số dư của bạn.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddAccountButton />
          </EmptyContent>
        </Empty>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {distribution.length > 0 ? (
        <SettingsGroup title="Tài khoản">
          {distribution.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              share={account}
              onSelect={() => setOpenAccountId(account.id)}
            />
          ))}
        </SettingsGroup>
      ) : null}

      {archivedAccounts.length > 0 ? (
        <Collapsible defaultOpen={distribution.length === 0}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="group/archived">
              Đã khoá
              <Badge variant="outline">{archivedAccounts.length}</Badge>
              <ChevronDownIcon
                className="transition-transform group-data-[state=open]/archived:rotate-180"
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <SettingsGroup footer="Không dùng cho giao dịch mới và không tính vào tổng số dư.">
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
        onOpenChange={(open) => {
          if (!open) setOpenAccountId(null)
        }}
      />
    </div>
  )
}
