import { BanknoteIcon, LandmarkIcon, SmartphoneIcon, type LucideIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import { accountTypeLabels } from "@/lib/accounts/labels"
import type { Account, AccountType, BalanceSummary } from "@/lib/accounts/types"
import { cn } from "@/lib/utils"

const accountTypeIcons: Record<AccountType, LucideIcon> = {
  bank: LandmarkIcon,
  "e-wallet": SmartphoneIcon,
  cash: BanknoteIcon,
}

/**
 * The active accounts' total, the one figure this page leads with, on the
 * dark inverse card (without the discs, so it is not the overview's net
 * worth again). Beside it, the kinds held, overlapped like cards in a wallet;
 * below it, when the money sits in more than one kind, each kind's full
 * balance on its own line, a negative one in red (a share bar could not show it).
 */
export function BalanceHero({ summary, accounts }: { summary: BalanceSummary; accounts: Account[] }) {
  const active = accounts.filter((account) => account.status === "active")
  const parts = (Object.keys(accountTypeLabels) as AccountType[])
    .filter((type) => active.some((account) => account.type === type))
    .map((type) => ({
      type,
      total: active.filter((account) => account.type === type).reduce((total, account) => total + account.balance, 0),
    }))

  return (
    <Card size="lg" variant="inverse" discs={false}>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardLabel>Tổng số dư</CardLabel>
            <Money amount={summary.totalBalance} size="xl" tone={summary.totalBalance < 0 ? "expense" : "default"} />
          </div>
          {parts.length > 0 ? (
            <div aria-hidden="true" className="flex shrink-0 -space-x-2 pt-1">
              {parts.map((part, index) => {
                const Icon = accountTypeIcons[part.type]
                return (
                  <span
                    key={part.type}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full ring-2 ring-inverse [&_svg]:size-4",
                      index === 0 ? "bg-ai text-ai-foreground" : "bg-inverse-foreground/15",
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
          <ul className="mt-5 flex flex-col rounded-2xl bg-inverse-foreground/[0.07] px-4">
            {parts.map((part) => {
              const Icon = accountTypeIcons[part.type]
              return (
                <li key={part.type} className="flex min-h-12 items-center gap-3 not-first:border-t not-first:border-inverse-foreground/10">
                  <Icon className="size-4 shrink-0 text-inverse-foreground/60" aria-hidden="true" />
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
