import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import type { Account } from "@/lib/accounts/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { amountLeft, formatDueMonth, isOverdue, jarPlanLabel, monthlyAmount, savedShare } from "@/lib/savings/plan"
import { cn } from "@/lib/utils"

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

/**
 * A savings jar as a card of the phone's two-up grid (2026-10-23, the
 * handoff): the lime ring and how far it is at the top, the name and its plan
 * (what to put in each month, the due month) in the middle, what it holds of
 * its target at the foot. A full jar says so in green. The whole card opens
 * the jar's sheet.
 */
export function JarTile({ jar, today, onSelect }: { jar: Account; today: string; onSelect: () => void }) {
  const left = amountLeft(jar)
  const monthly = monthlyAmount(jar, today)
  const due = jar.goal?.due
  const overdue = due ? isOverdue(due, today) : false
  const plan =
    left === 0
      ? "Đã đạt mục tiêu"
      : overdue
        ? `Quá hạn · thiếu ${formatCompactCurrency(left, 1)}`
        : monthly
          ? `Nạp ${formatCompactCurrency(monthly, 1)} mỗi tháng`
          : `Còn thiếu ${formatCompactCurrency(left, 1)}`
  const planDue = left === 0 ? "Sẵn sàng để mua" : due && !overdue ? `Hạn ${formatDueMonth(due)}` : undefined
  return (
    <Card asChild className="pressable min-h-42 gap-3.5 rounded-[24px] px-4 text-left outline-none [--card-spacing:--spacing(4)] focus-visible:ring-3 focus-visible:ring-ring/30">
      <button type="button" onClick={onSelect}>
        <span className="flex items-start justify-between">
          <JarRing jar={jar} size="tile" />
          <span className="pt-1 text-xs font-extrabold text-muted-foreground tabular-nums">{Math.round(savedShare(jar) * 100)}%</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15.5px] leading-snug font-bold">{jar.name}</span>
          <span className={cn("mt-[3px] truncate text-[11.5px] leading-snug font-bold", left === 0 ? "text-income" : "text-muted-foreground")}>
            {plan}
          </span>
          {planDue ? <span className="truncate text-[11.5px] leading-snug font-semibold text-muted-foreground/70">{planDue}</span> : null}
        </span>
        <span className="text-[17px] leading-none font-extrabold tracking-[-0.02em] whitespace-nowrap tabular-nums">
          {formatCompactCurrency(jar.balance, 1)}
          <span className="text-[13px] font-semibold tracking-normal text-muted-foreground/70"> / {formatCompactCurrency(jar.goal?.target ?? 0, 1)}</span>
        </span>
      </button>
    </Card>
  )
}
