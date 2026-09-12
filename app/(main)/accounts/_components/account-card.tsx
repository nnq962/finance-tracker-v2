"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"

import type { Account } from "../_types/account"
import { AccountActionsMenu } from "./account-actions/account-actions-menu"

type AccountCardProps = {
  account: Account
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={account.logoUrl} alt={account.name} />
            <AvatarFallback>{account.logoFallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <CardTitle>{account.name}</CardTitle>
            <CardDescription>Tài khoản chi tiêu</CardDescription>
          </div>
        </div>
        <CardAction>
          <AccountActionsMenu account={account} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatCurrency(account.balance)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
