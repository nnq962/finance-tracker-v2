import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Stat, StatGroup } from "@/components/app/stat-group"
import { Card, CardContent } from "@/components/ui/card"
import { accountTypeLabels } from "@/lib/accounts/labels"
import type { Account, AccountType, BalanceSummary } from "@/lib/accounts/types"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"

/**
 * The active accounts' total, the one figure this page leads with, on the
 * dark inverse card; below it, when the money sits in more than one kind of
 * account, how much is in each (banks, e-wallets, cash).
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
    <Card size="lg" variant="inverse">
      <CardContent className="flex flex-col gap-1">
        <CardLabel>Tổng số dư</CardLabel>
        <Money amount={summary.totalBalance} size="xl" tone={summary.totalBalance < 0 ? "expense" : "default"} />
        {parts.length > 1 ? (
          // Up to three share the card's width, so the amounts are shortened;
          // the full ones are in the tooltip and the accessible name.
          <StatGroup separated className="mt-4">
            {parts.map((part) => (
              <Stat
                key={part.type}
                label={accountTypeLabels[part.type]}
                value={formatCompactCurrency(part.total, 1)}
                title={formatCurrency(part.total)}
              />
            ))}
          </StatGroup>
        ) : null}
      </CardContent>
    </Card>
  )
}
