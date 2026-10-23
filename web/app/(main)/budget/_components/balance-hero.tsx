import { BanknoteIcon, EyeOffIcon, LandmarkIcon, LockIcon, PiggyBankIcon, SmartphoneIcon, WalletIcon, type LucideIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { Chip } from "@/components/app/chip"
import { IconTile, type IconTileTone } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { Card } from "@/components/ui/card"
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
 * Each kind's tile on phones (2026-10-24): the design system's neutral tile,
 * as the list below draws banks, wallets and cash (AccountLogo), and the jars
 * in the solid lime, as their rings. The wallet glyph for e-wallets, as the
 * handoff draws them.
 */
const accountTypeTiles: Record<AccountType, { icon: LucideIcon; tone: IconTileTone }> = {
  savings: { icon: PiggyBankIcon, tone: "accent" },
  bank: { icon: LandmarkIcon, tone: "neutral" },
  "e-wallet": { icon: WalletIcon, tone: "neutral" },
  cash: { icon: BanknoteIcon, tone: "neutral" },
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
      {/* Phones (2026-10-23, the handoff): the total bare on the page, what it holds aside as small
          chips under it, then each kind as a small card, two to a row, largest first. */}
      <div className="lg:hidden">
        <div className="px-1">
          <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
          <div className="@container mt-2">
            <Money amount={summary.totalBalance} size="hero" fit tone={totalTone} />
          </div>
          {locked.length > 0 || left.length > 0 ? (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {locked.length > 0 ? (
                <Chip size="sm" media={<LockIcon aria-hidden="true" />}>
                  {formatCompactCurrency(lockedTotal, 1)} đang khoá
                </Chip>
              ) : null}
              {left.length > 0 ? (
                <Chip size="sm" media={<EyeOffIcon aria-hidden="true" />}>
                  {formatCompactCurrency(leftTotal, 1)} ngoài báo cáo
                </Chip>
              ) : null}
            </div>
          ) : null}
        </div>
        {parts.length > 1 && parts.some((part) => part.count > 1) ? (
          <ul className="mt-[22px] grid grid-cols-2 gap-2.5">
            {[...parts]
              .sort((first, second) => second.total - first.total)
              .map((part) => {
                const tile = accountTypeTiles[part.type]
                return (
                  <li key={part.type}>
                    <Card className="gap-3.5 rounded-[22px] px-3.5 [--card-spacing:--spacing(3.5)]">
                      <IconTile icon={tile.icon} tone={tile.tone} size="sm" className="size-8 [&_svg]:size-[17px]" />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-xs font-semibold text-muted-foreground">{accountTypeLabels[part.type]}</span>
                        <span
                          className={cn(
                            "text-[17px] leading-tight font-extrabold tracking-[-0.02em] whitespace-nowrap tabular-nums",
                            part.total < 0 && "text-expense",
                          )}
                        >
                          {part.total < 0 ? "−" : ""}
                          {formatCompactCurrency(Math.abs(part.total), 1)}
                        </span>
                      </span>
                    </Card>
                  </li>
                )
              })}
          </ul>
        ) : null}
      </div>

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
