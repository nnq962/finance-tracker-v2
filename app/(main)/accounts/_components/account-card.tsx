import { AccountLogo } from "@/components/account-logo"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { AccountActionsMenu } from "./account-actions/account-actions-menu"

type AccountCardProps = {
  account: Account
  categoryGroups: CategoryGroup[]
}

export function AccountCard({
  account,
  categoryGroups,
}: AccountCardProps) {
  const isLocked = account.status === "archived"
  const accountKind =
    account.type === "cash"
      ? "Tiền mặt"
      : account.institutionName ??
        (account.type === "bank" ? "Ngân hàng" : "Ví điện tử")

  return (
    <Card className="relative">
      <div
        className={`absolute inset-x-0 top-0 h-1 origin-left bg-destructive transition-transform duration-700 ease-in-out motion-reduce:transition-none ${
          isLocked ? "scale-x-100" : "scale-x-0"
        }`}
        aria-hidden="true"
      />
      <CardHeader>
        <div className="flex items-center gap-3">
          <AccountLogo account={account} />
          <div className="min-w-0 space-y-1">
            <CardTitle>{account.name}</CardTitle>
            <CardDescription>
              {accountKind}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <AccountActionsMenu
            account={account}
            categoryGroups={categoryGroups}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {isLocked ? "Số dư đã khóa" : "Số dư hiện tại"}
          </p>
          <p
            className={`text-xl font-semibold tabular-nums ${
              isLocked ? "text-muted-foreground line-through" : ""
            }`}
          >
            {formatCurrency(account.balance)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
