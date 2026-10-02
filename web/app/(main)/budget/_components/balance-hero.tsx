import type { CSSProperties } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getAccountDistribution } from "@/lib/accounts/distribution"
import type { Account, BalanceSummary } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

type BalanceHeroProps = {
  summary: BalanceSummary
  accounts: Account[]
}

/** The total, and one bar split by account; each account row carries its colour and share. */
export function BalanceHero({ summary, accounts }: BalanceHeroProps) {
  const { distribution, accountsTotal } = getAccountDistribution(accounts)
  const gradientStops: string[] = []
  let gradientOffset = 0

  if (accountsTotal > 0) {
    for (const account of distribution) {
      if (account.distributionBalance <= 0) continue

      const start = gradientOffset
      gradientOffset += account.distributionBalance / accountsTotal * 100
      gradientStops.push(`${account.fill} ${start}% ${gradientOffset}%`)
    }
  }

  const distributionProgressStyle = {
    "--distribution-gradient": gradientStops.length > 0
      ? `linear-gradient(to right, ${gradientStops.join(", ")})`
      : "none",
  } as CSSProperties

  return (
    <Card asChild>
      <section aria-label="Tổng số dư">
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Tổng số dư khả dụng</p>
            <p className="font-heading text-3xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere]">
              {formatCurrency(summary.totalBalance)}
            </p>
          </div>
          {accountsTotal > 0 ? (
            <Progress
              value={100}
              aria-hidden="true"
              className="[&_[data-slot=progress-indicator]]:[background-image:var(--distribution-gradient)]"
              style={distributionProgressStyle}
            />
          ) : null}
          <p className="text-xs text-muted-foreground">
            {distribution.length} tài khoản · cập nhật {summary.updatedAt}
          </p>
        </CardContent>
      </section>
    </Card>
  )
}
