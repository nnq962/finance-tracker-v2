import { WalletCardsIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { AccountCard } from "./account-card"

type AccountListProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
}

export function AccountList({
  accounts,
  categoryGroups,
}: AccountListProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Tài khoản</h2>
          <p className="text-sm text-muted-foreground">
            Tiền mặt, ngân hàng và ví điện tử của bạn.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {accounts.length} tài khoản
        </p>
      </div>

      {accounts.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              categoryGroups={categoryGroups}
            />
          ))}
        </div>
      )}
    </section>
  )
}
