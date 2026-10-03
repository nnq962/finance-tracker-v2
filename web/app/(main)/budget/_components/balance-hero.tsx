import type { CSSProperties } from "react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Progress } from "@/components/ui/progress"
import { getAccountDistribution } from "@/lib/accounts/distribution"
import type { Account, BalanceSummary } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

type BalanceHeroProps = {
  summary: BalanceSummary
  accounts: Account[]
}

/**
 * The total and one bar split by account type, then a row per type in its
 * colour in the bar, as the legend.
 */
export function BalanceHero({ summary, accounts }: BalanceHeroProps) {
  const { distribution, groups, accountsTotal } = getAccountDistribution(accounts)
  const gradientStops: string[] = []
  let gradientOffset = 0

  if (accountsTotal > 0) {
    for (const group of groups) {
      if (group.total <= 0) continue

      const start = gradientOffset
      gradientOffset += group.total / accountsTotal * 100
      gradientStops.push(`${group.fill} ${start}% ${gradientOffset}%`)
    }
  }

  const distributionProgressStyle = {
    "--distribution-gradient": gradientStops.length > 0
      ? `linear-gradient(to right, ${gradientStops.join(", ")})`
      : "none",
  } as CSSProperties

  return (
    <SettingsGroup
      title="Tổng số dư"
      header={
        // 16px all round, where the rows' content starts.
        <div className="space-y-3 p-4">
          <p className="font-heading text-3xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere]">
            {formatCurrency(summary.totalBalance)}
          </p>
          {accountsTotal > 0 ? (
            <Progress
              value={100}
              aria-hidden="true"
              className="[&_[data-slot=progress-indicator]]:[background-image:var(--distribution-gradient)]"
              style={distributionProgressStyle}
            />
          ) : null}
          <p className="text-xs text-muted-foreground">
            {distribution.length} tài khoản
          </p>
        </div>
      }
    >
      {groups.map((group) => (
        <SettingsRow
          key={group.type}
          icon={group.icon}
          color={group.color}
          title={group.label}
          description={group.percentageLabel}
          value={formatCurrency(group.total)}
        />
      ))}
    </SettingsGroup>
  )
}
