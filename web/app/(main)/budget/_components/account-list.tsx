import { LockIcon, WalletCardsIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
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

import { AccountCard } from "./account-card"
import { AddAccountButton } from "./add-account-button"

type AccountListProps = {
  accounts: Account[]
}

export function AccountList({
  accounts,
}: AccountListProps) {
  const { distribution } = getAccountDistribution(accounts)
  const distributionById = new Map(distribution.map((account) => [account.id, account]))
  const activeAccounts = accounts.filter((account) => account.status === "active")
  const archivedAccounts = accounts.filter((account) => account.status === "archived")

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
    <div className="space-y-8">
      {activeAccounts.length > 0 ? (
        <section className="space-y-4" aria-labelledby="active-accounts-title">
          <div className="flex items-center gap-2">
            <h2 id="active-accounts-title" className="text-lg font-semibold">
              Danh sách tài khoản
            </h2>
            <Badge variant="secondary">{activeAccounts.length}</Badge>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
            {activeAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                distribution={distributionById.get(account.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {archivedAccounts.length > 0 ? (
        <section className="space-y-4" aria-labelledby="archived-accounts-title">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 id="archived-accounts-title" className="flex items-center gap-2 text-lg font-semibold">
                <LockIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                Đã khóa
              </h2>
              <Badge variant="outline">{archivedAccounts.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Không dùng cho giao dịch mới và không tính vào tổng số dư.
            </p>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
            {archivedAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
