import { BanknoteIcon, LandmarkIcon, PiggyBankIcon, SmartphoneIcon, type LucideIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import { accountTypeLabels } from "@/lib/accounts/labels"
import { formatCompactCurrency } from "@/lib/format-currency"
import type { Account, AccountType, BalanceSummary } from "@/lib/accounts/types"
import { cn } from "@/lib/utils"

const accountTypeIcons: Record<AccountType, LucideIcon> = {
  bank: LandmarkIcon,
  "e-wallet": SmartphoneIcon,
  cash: BanknoteIcon,
  savings: PiggyBankIcon,
}

/**
 * The total of the accounts counted in the figures (archived ones too), the one figure this page leads with, on the
 * pastel card (2026-10-18, was the dark inverse one; mint-led from the top
 * right since 2026-10-19), so it is not the overview's net worth again. Beside it, the kinds held, overlapped like cards in a wallet;
 * below it, when the money sits in more than one kind, each kind's full
 * balance on its own line, a negative one in red (a share bar could not show it).
 */
export function BalanceHero({ summary, accounts }: { summary: BalanceSummary; accounts: Account[] }) {
  const active = accounts.filter((account) => !account.excluded)
  const left = accounts.filter((account) => account.excluded)
  const leftTotal = left.reduce((total, account) => total + account.balance, 0)
  const parts = (Object.keys(accountTypeLabels) as AccountType[])
    // Finished jars hold nothing: no "Hũ tiết kiệm 0đ" line for them alone.
    .filter((type) => active.some((account) => account.type === type && !account.goal?.completedAt))
    .map((type) => ({
      type,
      total: active.filter((account) => account.type === type).reduce((total, account) => total + account.balance, 0),
    }))

  return (
    <Card size="lg" variant="pastel" blend="balance" discs={false}>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          {/* The figure fits its column on one line (from 100 triệu up it wrapped mid-number beside the icons, 2026-10-16). */}
          <div className="@container flex min-w-0 flex-1 flex-col gap-1">
            <CardLabel>Tổng số dư</CardLabel>
            <Money amount={summary.totalBalance} size="xl" fit tone={summary.totalBalance < 0 ? "expense" : "default"} />
            {left.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {left.length} tài khoản ngoài báo cáo · {formatCompactCurrency(leftTotal, 1)}
              </p>
            ) : null}
          </div>
          {parts.length > 0 ? (
            <div aria-hidden="true" className="flex shrink-0 -space-x-2 pt-1">
              {/* Three at most, so a long total keeps its line (the savings jars come fourth). */}
              {parts.slice(0, 3).map((part, index) => {
                const Icon = accountTypeIcons[part.type]
                return (
                  <span
                    key={part.type}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full ring-2 ring-pastel-base [&_svg]:size-4",
                      index === 0 ? "bg-ai text-ai-foreground" : "bg-foreground/8 dark:bg-foreground/15",
                    )}
                  >
                    <Icon />
                  </span>
                )
              })}
            </div>
          ) : null}
        </div>
        {parts.length > 1 ? (
          <ul className="mt-5 flex flex-col rounded-2xl bg-pastel-tile px-4 shadow-[inset_0_0_0_1px_var(--pastel-tile-edge)]">
            {parts.map((part) => {
              const Icon = accountTypeIcons[part.type]
              return (
                <li key={part.type} className="flex min-h-12 items-center gap-3 not-first:border-t not-first:border-foreground/8">
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
  )
}
