import { LockKeyholeIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { Badge } from "@/components/ui/badge"
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

import { AccountActionsMenu } from "./account-actions/account-actions-menu"

type AccountCardProps = {
  account: Account
}

export function AccountCard({ account }: AccountCardProps) {
  const isLocked = account.status === "archived"
  const accountKind =
    account.type === "cash"
      ? "Tiền mặt"
      : account.institutionName ??
        (account.type === "bank" ? "Ngân hàng" : "Ví điện tử")

  return (
    <Card className="relative">
      {isLocked ? (
        <div
          className="absolute inset-x-0 top-0 h-1 bg-destructive"
          aria-hidden="true"
        />
      ) : null}
      <CardHeader>
        <div className="flex items-center gap-3">
          <AccountLogo account={account} />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{account.name}</CardTitle>
              {isLocked ? (
                <Badge variant="destructive">
                  <LockKeyholeIcon data-icon="inline-start" />
                  Ngừng sử dụng
                </Badge>
              ) : null}
            </div>
            <CardDescription>
              {accountKind}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <AccountActionsMenu account={account} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {isLocked ? "Số dư khi khóa" : "Số dư hiện tại"}
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
