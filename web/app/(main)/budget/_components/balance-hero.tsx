import type { CSSProperties } from "react"

import { SettingsGroup } from "@/components/settings-list"
import { Progress } from "@/components/ui/progress"
import { getAccountDistribution } from "@/lib/accounts/distribution"
import type { Account, BalanceSummary } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

type BalanceHeroProps = {
  summary: BalanceSummary
  accounts: Account[]
}

/**
 * The total and one bar split by account type, with a one-line legend of
 * each type's colour and share; the amounts per type head the list below.
 */
export function BalanceHero({ summary, accounts }: BalanceHeroProps) {
  const { groups, accountsTotal } = getAccountDistribution(accounts)
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
          <p className="text-2xl font-semibold tabular-nums [overflow-wrap:anywhere]">
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
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {groups.map((group) => (
              <li key={group.type} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: group.fill }} />
                {group.label}
                <span className="font-medium text-foreground tabular-nums">{group.percentageLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      {null}
    </SettingsGroup>
  )
}
