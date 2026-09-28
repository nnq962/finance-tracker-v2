import { PlusIcon, WalletCardsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getAccountDistribution } from "@/lib/accounts/distribution"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { AccountCard } from "./account-card"
import { AddAccountSheet } from "./add-account/add-account-sheet"

type AccountListProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
}

export function AccountList({
  accounts,
  categoryGroups,
}: AccountListProps) {
  const { distribution } = getAccountDistribution(accounts)
  const distributionById = new Map(distribution.map((account) => [account.id, account]))

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Tài khoản</h2>
          <p className="text-sm text-muted-foreground">
            Tiền mặt, ngân hàng và ví điện tử của bạn.
          </p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
          {accounts.length} tài khoản
        </p>
      </div>

      {accounts.length === 0 && (
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
          </Empty>
        </Card>
      )}

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            distribution={distributionById.get(account.id)}
            categoryGroups={categoryGroups}
          />
        ))}
        <AddAccountSheet
          trigger={
            <button
              type="button"
              className="hidden min-h-0 w-full sm:flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d6d2c8] bg-transparent p-6 text-base font-bold text-muted-foreground transition-colors hover:border-primary hover:bg-muted/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:border-[#4a4656] dark:hover:border-primary"
            >
              <PlusIcon className="size-5" aria-hidden="true" />
              Thêm tài khoản
            </button>
          }
        />
      </div>
      <div className="sm:hidden">
        <AddAccountSheet
          trigger={
            <Button type="button" className="w-full">
              <PlusIcon aria-hidden="true" />
              Thêm tài khoản
            </Button>
          }
        />
      </div>
    </section>
  )
}
