import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import type { Account } from "@/lib/accounts/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { amountLeft, jarPlanLabel } from "@/lib/savings/plan"
import { cn } from "@/lib/utils"

import { JarRing } from "./jar-ring"

/**
 * A savings jar as a card in the jars' grid (desktop), the size of an
 * account's: its ring and name with its plan, then what it holds of the
 * target (the target and monthly tiles below a line left 2026-10-21, as they
 * repeated the "/ target" and the plan line). The whole card opens the jar's sheet.
 */
export function JarCard({ jar, today, onSelect }: { jar: Account; today: string; onSelect: () => void }) {
  const left = amountLeft(jar)

  return (
    <Card size="lg" asChild className="pressable text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30 [@media(hover:hover)]:hover:shadow-[0_12px_48px_rgb(0_0_0/0.16)] [@media(hover:hover)]:transition-[scale,box-shadow]">
      <button type="button" onClick={onSelect}>
        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          <span className="flex min-w-0 items-center gap-3">
            <JarRing jar={jar} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{jar.name}</span>
              <span className={cn("truncate text-xs", left === 0 ? "text-income" : "text-muted-foreground")}>
                {left === 0 ? "Đủ tiền rồi 🎉" : jarPlanLabel(jar, today)}
              </span>
            </span>
          </span>
          <span className="flex flex-col">
            <CardLabel as="span">Đã có</CardLabel>
            <span className="flex items-baseline gap-1.5">
              <Money amount={jar.balance} size="lg" />
              <span className="text-sm text-muted-foreground tabular-nums">/ {formatCompactCurrency(jar.goal?.target ?? 0, 1)}</span>
            </span>
          </span>
        </CardContent>
      </button>
    </Card>
  )
}
