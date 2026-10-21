import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import type { Account } from "@/lib/accounts/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { amountLeft, jarPlanLabel } from "@/lib/savings/plan"

import { GridCardHead, gridButtonCardClassName, gridCardContentClassName } from "../account-grid"
import { JarRing } from "./jar-ring"

/**
 * A savings jar as a card of the accounts grid (desktop), an account card's
 * shape (2026-10-21): its ring, name and plan at the top, what it holds of
 * its target at the foot. The whole card opens the jar's sheet.
 */
export function JarCard({ jar, today, onSelect }: { jar: Account; today: string; onSelect: () => void }) {
  const full = amountLeft(jar) === 0
  return (
    <Card size="lg" asChild className={gridButtonCardClassName}>
      <button type="button" onClick={onSelect}>
        <CardContent className={gridCardContentClassName}>
          <GridCardHead
            media={<JarRing jar={jar} />}
            title={jar.name}
            description={full ? <span className="text-income">Đủ tiền rồi 🎉</span> : jarPlanLabel(jar, today)}
          />
          <span className="flex items-baseline gap-1.5">
            <Money amount={jar.balance} size="lg" />
            <span className="text-sm text-muted-foreground tabular-nums">/ {formatCompactCurrency(jar.goal?.target ?? 0, 1)}</span>
          </span>
        </CardContent>
      </button>
    </Card>
  )
}
