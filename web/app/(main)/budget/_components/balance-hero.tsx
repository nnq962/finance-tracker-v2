import { BanknoteIcon, LandmarkIcon, PiggyBankIcon, SmartphoneIcon, type LucideIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import { accountTypeLabels } from "@/lib/accounts/labels"
import { formatCompactCurrency } from "@/lib/format-currency"
import type { Account, AccountType, BalanceSummary } from "@/lib/accounts/types"
import { cn } from "@/lib/utils"

import { accountGridClassName, GridCard, GridCardHead } from "./account-grid"

const accountTypeIcons: Record<AccountType, LucideIcon> = {
  bank: LandmarkIcon,
  "e-wallet": SmartphoneIcon,
  cash: BanknoteIcon,
  savings: PiggyBankIcon,
}

/**
 * The total of the accounts counted in the figures (archived ones too), the
 * one figure this page leads with. A line names what the locked accounts
 * hold, as it is counted but folded away below (2026-10-21).
 *
 * On phones one plain card: the total, then each kind's full balance on a
 * track (a negative one in red, which a share bar could not show), only
 * when some kind holds two accounts or more: one account a kind would
 * repeat the list just below.
 * From lg the first row of the accounts grid, each card an account card's
 * size (2026-10-21): the total, then one card per kind (its icon, its name
 * and how many, its balance at the foot), every kind there is.
 */
export function BalanceHero({ summary, accounts }: { summary: BalanceSummary; accounts: Account[] }) {
  const active = accounts.filter((account) => !account.excluded)
  const left = accounts.filter((account) => account.excluded)
  const leftTotal = left.reduce((total, account) => total + account.balance, 0)
  const locked = active.filter((account) => account.status === "archived" && account.balance !== 0)
  const lockedTotal = locked.reduce((total, account) => total + account.balance, 0)
  const parts = (Object.keys(accountTypeLabels) as AccountType[])
    .map((type) => {
      // Finished jars hold nothing: no "Hũ tiết kiệm 0đ" for them alone.
      const ofType = active.filter((account) => account.type === type && !account.goal?.completedAt)
      return { type, count: ofType.length, total: ofType.reduce((total, account) => total + account.balance, 0) }
    })
    .filter((part) => part.count > 0)
  const label = parts.length === 1 ? `Tổng số dư · ${accountTypeLabels[parts[0].type]}` : "Tổng số dư"
  const notes = (
    <>
      {locked.length > 0 ? (
        <span className="block text-xs text-pretty text-muted-foreground">
          Gồm {locked.length} tài khoản đã khoá · {formatCompactCurrency(lockedTotal, 1)}
        </span>
      ) : null}
      {left.length > 0 ? (
        <span className="block text-xs text-pretty text-muted-foreground">
          {left.length} tài khoản ngoài báo cáo · {formatCompactCurrency(leftTotal, 1)}
        </span>
      ) : null}
    </>
  )
  const totalTone = summary.totalBalance < 0 ? "expense" : "default"

  return (
    <>
      <Card size="lg" className="lg:hidden">
        <CardContent>
          {/* The figure fits its column on one line (from 100 triệu up it wrapped mid-number, 2026-10-16). */}
          <div className="@container flex min-w-0 flex-col gap-1">
            <CardLabel>{label}</CardLabel>
            <Money amount={summary.totalBalance} size="xl" fit tone={totalTone} />
            {notes}
          </div>
          {parts.length > 1 && parts.some((part) => part.count > 1) ? (
            <ul className="mt-5 flex flex-col rounded-[16px] bg-track px-4">
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
          ) : null}
        </CardContent>
      </Card>

      <div className={cn(accountGridClassName, "hidden lg:grid")}>
        <GridCard>
          <span className="flex flex-col">
            <CardLabel>{label}</CardLabel>
            {notes}
          </span>
          <span className="@container">
            <Money amount={summary.totalBalance} size="xl" fit tone={totalTone} />
          </span>
        </GridCard>
        {parts.length > 1
          ? parts.map((part) => (
              <GridCard key={part.type}>
                <GridCardHead
                  media={<IconTile icon={accountTypeIcons[part.type]} tone="neutral" size="sm" />}
                  title={accountTypeLabels[part.type]}
                  description={`${part.count} ${part.type === "savings" ? "hũ" : "tài khoản"}`}
                />
                <Money amount={part.total} size="lg" tone={part.total < 0 ? "expense" : "default"} />
              </GridCard>
            ))
          : null}
      </div>
    </>
  )
}
