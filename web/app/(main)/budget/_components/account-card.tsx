"use client"

import type { CSSProperties } from "react"

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
  distribution?: { fill: string; percentageLabel: string }
}

export function AccountCard({
  account,
  distribution,
}: AccountCardProps) {
  const isLocked = account.status === "archived"
  const accountKind =
    account.type === "cash"
      ? "Tiền mặt"
      : account.institutionName ??
        (account.type === "bank" ? "Ngân hàng" : "Ví điện tử")

  const balanceBadge = distribution && !isLocked && (
    <Badge
      className="text-[color:var(--account-color)] dark:text-[color:color-mix(in_srgb,var(--account-color),white_35%)]"
      style={{
        "--account-color": distribution.fill,
        backgroundColor: `color-mix(in srgb, ${distribution.fill} 12%, transparent)`,
      } as CSSProperties}
      aria-label={`${distribution.percentageLabel} tổng số dư khả dụng`}
    >
      {distribution.percentageLabel}
    </Badge>
  )

  return (
    <>
      <AccountActionsMenu
        presentation="drawer"
        account={account}
        trigger={
          <Card pressable asChild className={`min-w-0 flex-row items-center justify-between gap-3 px-(--card-spacing) text-left sm:hidden ${isLocked ? "[--button-shade:var(--destructive)] dark:[--button-shade:var(--destructive)]" : ""}`}>
            <button type="button">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <AccountLogo account={account} />
                <div className="min-w-0">
                  <CardTitle className="truncate">{account.name}</CardTitle>
                  <CardDescription className="truncate">{accountKind}</CardDescription>
                </div>
              </div>
              <span className="flex max-w-[55%] shrink-0 flex-col items-end gap-1.5">
                <span className={`max-w-full text-right font-heading text-lg font-extrabold tabular-nums [overflow-wrap:anywhere] ${isLocked ? "text-muted-foreground line-through" : ""}`}>
                  {formatCurrency(account.balance)}
                </span>
                {isLocked ? <Badge variant="outline">Đã khóa</Badge> : balanceBadge}
              </span>
            </button>
          </Card>
        }
      />
      <Card className="relative hidden sm:flex">
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
            />
          </CardAction>
        </CardHeader>
        <CardContent className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {isLocked ? "Số dư đã khóa" : "Số dư hiện tại"}
            </p>
            <p
              className={`text-xl font-semibold tabular-nums [overflow-wrap:anywhere] ${
                isLocked ? "text-muted-foreground line-through" : ""
              }`}
            >
              {formatCurrency(account.balance)}
            </p>
          </div>
          {balanceBadge}
        </CardContent>
      </Card>
    </>
  )
}
