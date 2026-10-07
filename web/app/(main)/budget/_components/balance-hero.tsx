import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import type { BalanceSummary } from "@/lib/accounts/types"

/** The active accounts' total, the one figure this page leads with, on the dark inverse card. */
export function BalanceHero({ summary }: { summary: BalanceSummary }) {
  return (
    <Card size="lg" variant="inverse">
      <CardContent className="flex flex-col gap-1">
        <CardLabel>Tổng số dư</CardLabel>
        <Money amount={summary.totalBalance} size="xl" />
      </CardContent>
    </Card>
  )
}
