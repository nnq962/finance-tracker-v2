import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import type { DebtDirection, DebtSummaryData } from "../_types/debt"

type DebtSummaryProps = {
  summary: DebtSummaryData
}

const lentClassName = "text-[#3e9727] dark:text-[#94e379]"
const borrowedClassName = "text-[#c8393a] dark:text-[#ff9b93]"

function DirectionStat({
  amount,
  direction,
}: {
  amount: number
  direction: DebtDirection
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">
        {direction === "lent" ? "Người khác nợ tôi" : "Tôi đang nợ"}
      </p>
      <p
        className={cn(
          "font-heading text-xl leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere]",
          direction === "lent" ? lentClassName : borrowedClassName,
        )}
      >
        {formatCurrency(amount)}
      </p>
    </div>
  )
}

/** Totals owed each way, then the net balance on one line. */
export function DebtSummary({ summary }: DebtSummaryProps) {
  const { netBalance, totalBorrowed, totalLent } = summary

  return (
    <section aria-labelledby="debt-summary-title" className="space-y-2">
      {/* A caption like the lists' below, the same height as the detail
          panel's beside it, so both columns start on one line. */}
      <div className="flex min-h-6 items-center px-3">
        <h2
          id="debt-summary-title"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Tổng quan
        </h2>
      </div>
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DirectionStat amount={totalLent} direction="lent" />
            <DirectionStat amount={totalBorrowed} direction="borrowed" />
          </div>
          <Separator variant="chunky" />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Cân đối</span>
            <span
              className={cn(
                "font-heading font-extrabold tabular-nums",
                netBalance > 0 && lentClassName,
                netBalance < 0 && borrowedClassName,
              )}
            >
              {formatCurrency(netBalance, {
                signDisplay: netBalance === 0 ? "auto" : "always",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
