import { BanknoteIcon, LandmarkIcon, PiggyBankIcon, SmartphoneIcon, type LucideIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Stat, StatGroup } from "@/components/app/stat-group"
import { Card, CardContent } from "@/components/ui/card"
import { accountTypeLabels } from "@/lib/accounts/labels"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import type { Account, AccountType, BalanceSummary } from "@/lib/accounts/types"

const accountTypeIcons: Record<AccountType, LucideIcon> = {
  bank: LandmarkIcon,
  "e-wallet": SmartphoneIcon,
  cash: BanknoteIcon,
  savings: PiggyBankIcon,
}

/**
 * The total of the accounts counted in the figures (archived ones too), the
 * one figure this page leads with, on the plain card (2026-10-19, option E of
 * the lead-card mockup). Under it, a line naming what the locked accounts
 * hold, as it is counted but folded away below (2026-10-21), and the one
 * kind in words when the money sits in one kind only. With more than one
 * kind, each kind's full balance: on phones a list on a track (a negative
 * one in red, which a share bar could not show), from lg the overview's
 * shape, the figure on the left and the kinds as tiles on the right. The
 * wallet stack of kind icons is gone (2026-10-21): it repeated the list and
 * its lime, kept for AI and Pro, drew the eye from the figure.
 */
export function BalanceHero({ summary, accounts }: { summary: BalanceSummary; accounts: Account[] }) {
  const active = accounts.filter((account) => !account.excluded)
  const left = accounts.filter((account) => account.excluded)
  const leftTotal = left.reduce((total, account) => total + account.balance, 0)
  const locked = active.filter((account) => account.status === "archived" && account.balance !== 0)
  const lockedTotal = locked.reduce((total, account) => total + account.balance, 0)
  const parts = (Object.keys(accountTypeLabels) as AccountType[])
    // Finished jars hold nothing: no "Hũ tiết kiệm 0đ" line for them alone.
    .filter((type) => active.some((account) => account.type === type && !account.goal?.completedAt))
    .map((type) => ({
      type,
      total: active.filter((account) => account.type === type).reduce((total, account) => total + account.balance, 0),
    }))

  return (
    <Card size="lg">
      <CardContent className="lg:flex lg:items-end lg:justify-between lg:gap-10">
        {/* The figure fits its column on one line (from 100 triệu up it wrapped mid-number, 2026-10-16). */}
        <div className="@container flex min-w-0 flex-col gap-1 lg:flex-1">
          <CardLabel>{parts.length === 1 ? `Tổng số dư · ${accountTypeLabels[parts[0].type]}` : "Tổng số dư"}</CardLabel>
          <Money amount={summary.totalBalance} size="display" fit tone={summary.totalBalance < 0 ? "expense" : "default"} />
          {locked.length > 0 ? (
            <p className="text-xs text-pretty text-muted-foreground">
              Gồm {locked.length} tài khoản đã khoá · {formatCompactCurrency(lockedTotal, 1)}
            </p>
          ) : null}
          {left.length > 0 ? (
            <p className="text-xs text-pretty text-muted-foreground">
              {left.length} tài khoản ngoài báo cáo · {formatCompactCurrency(leftTotal, 1)}
            </p>
          ) : null}
        </div>
        {parts.length > 1 ? (
          <>
            <ul className="mt-5 flex flex-col rounded-[16px] bg-track px-4 lg:hidden">
              {parts.map((part) => {
                const Icon = accountTypeIcons[part.type]
                return (
                  <li key={part.type} className="flex min-h-12 items-center gap-3 not-first:border-t not-first:border-separator">
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm">{accountTypeLabels[part.type]}</span>
                    <Money amount={part.total} size="sm" tone={part.total < 0 ? "expense" : "default"} />
                  </li>
                )
              })}
            </ul>
            {/* Short amounts side by side, the full ones in the tooltip and the accessible name. */}
            <StatGroup tiles className="hidden lg:grid lg:w-[30rem] lg:shrink-0">
              {parts.slice(0, 3).map((part) => (
                <Stat
                  key={part.type}
                  label={accountTypeLabels[part.type]}
                  value={formatCompactCurrency(part.total, 1)}
                  title={formatCurrency(part.total)}
                />
              ))}
            </StatGroup>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
