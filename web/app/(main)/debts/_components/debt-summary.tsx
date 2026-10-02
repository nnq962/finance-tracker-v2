import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import type { Debt, DebtDirection, DebtSummaryData } from "../_types/debt"

type DebtSummaryProps = {
  debts: Debt[]
  summary: DebtSummaryData
}

const lentClassName = "text-[#3e9727] dark:text-[#94e379]"
const borrowedClassName = "text-[#c8393a] dark:text-[#ff9b93]"

function DirectionStat({
  amount,
  count,
  direction,
}: {
  amount: number
  count: number
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
      <p className="mt-0.5 text-xs text-muted-foreground">{count} khoản đang mở</p>
    </div>
  )
}

/** Totals owed each way, then the net balance on one line. */
export function DebtSummary({ debts, summary }: DebtSummaryProps) {
  const { netBalance, totalBorrowed, totalLent } = summary
  const openCount = (direction: DebtDirection) =>
    debts.filter((debt) => debt.direction === direction && debt.status !== "settled").length

  return (
    <Card asChild>
      <section aria-label="Tổng quan nợ và cho vay">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DirectionStat amount={totalLent} count={openCount("lent")} direction="lent" />
            <DirectionStat amount={totalBorrowed} count={openCount("borrowed")} direction="borrowed" />
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
      </section>
    </Card>
  )
}
