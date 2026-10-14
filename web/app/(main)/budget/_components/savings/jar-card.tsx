import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import type { Account } from "@/lib/accounts/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { amountLeft, jarPlanLabel, monthlyAmount } from "@/lib/savings/plan"
import { cn } from "@/lib/utils"

import { JarRing } from "./jar-ring"

/**
 * A savings jar as a card in the jars' grid (desktop), the size of an
 * account's: its ring and name with its plan, what it holds of the target,
 * and under a line the target and what to put in each month (or what is
 * missing). The whole card opens the jar's sheet.
 */
export function JarCard({ jar, today, onSelect }: { jar: Account; today: string; onSelect: () => void }) {
  const left = amountLeft(jar)
  const monthly = monthlyAmount(jar, today)

  return (
    <Card size="lg" asChild className="pressable text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
      <button type="button" onClick={onSelect}>
        <CardContent className="flex flex-col gap-5">
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
              <span className="text-sm text-muted-foreground">/ {formatCompactCurrency(jar.goal?.target ?? 0, 1)}</span>
            </span>
          </span>
          <span className="grid grid-cols-2 gap-2 border-t border-separator pt-4 text-sm">
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">Mục tiêu</span>
              <span className="font-semibold tabular-nums">{formatCompactCurrency(jar.goal?.target ?? 0, 1)}</span>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">{monthly ? "Mỗi tháng nên nạp" : "Còn thiếu"}</span>
              <span className="font-semibold tabular-nums">{formatCompactCurrency(monthly ?? left, 1)}</span>
            </span>
          </span>
        </CardContent>
      </button>
    </Card>
  )
}
