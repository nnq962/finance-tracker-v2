import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ScaleIcon,
} from "lucide-react"

import { SplitProgress } from "@/components/split-progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"

import { getDebtDeadline } from "../_lib/debt-presentation"
import type { Debt, DebtDirection, DebtSummaryData } from "../_types/debt"

type DebtSummaryProps = {
  debts: Debt[]
  summary: DebtSummaryData
}

const directionContent = {
  lent: {
    label: "Người khác nợ tôi",
    icon: ArrowUpRightIcon,
    surfaceClassName: "bg-[#dbf9d2] text-[#3e9727] dark:bg-[#203e1a] dark:text-[#94e379]",
    valueClassName: "text-[#3e9727] dark:text-[#94e379]",
  },
  borrowed: {
    label: "Tôi đang nợ",
    icon: ArrowDownLeftIcon,
    surfaceClassName: "bg-[#ffe5e1] text-[#c8393a] dark:bg-[#542523] dark:text-[#ff9b93]",
    valueClassName: "text-[#c8393a] dark:text-[#ff9b93]",
  },
} as const

function DirectionStat({
  amount,
  debts,
  direction,
}: {
  amount: number
  debts: Debt[]
  direction: DebtDirection
}) {
  const content = directionContent[direction]
  const Icon = content.icon
  const openDebts = debts.filter(
    (debt) => debt.direction === direction && debt.status !== "settled",
  )
  const overdueCount = openDebts.filter((debt) => getDebtDeadline(debt).isOverdue).length

  return (
    <div className="min-w-0 rounded-xl border-2 border-[#e7e4dd] p-3 sm:p-4 dark:border-[#35323e]">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${content.surfaceClassName}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {overdueCount > 0 ? (
          <Badge variant="solid">{overdueCount} quá hạn</Badge>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{content.label}</p>
      <p
        className={`font-heading text-lg leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere] sm:text-xl ${content.valueClassName}`}
      >
        {formatCurrency(amount)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {openDebts.length} khoản đang mở
      </p>
    </div>
  )
}

export function DebtSummary({ debts, summary }: DebtSummaryProps) {
  const { netBalance, totalBorrowed, totalLent } = summary
  const total = totalLent + totalBorrowed
  const lentShare = total > 0 ? Math.round((totalLent / total) * 100) : 0
  const netClassName =
    netBalance > 0
      ? "text-[#3e9727] dark:text-[#94e379]"
      : netBalance < 0
        ? "text-[#c8393a] dark:text-[#ff9b93]"
        : "text-foreground"
  const netHelper =
    netBalance === 0
      ? "Các khoản vay đang cân bằng"
      : netBalance > 0
        ? "Người khác nợ bạn nhiều hơn số bạn đang nợ"
        : "Bạn đang nợ nhiều hơn số người khác nợ bạn"

  return (
    <Card
      asChild
      className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]"
    >
      <section aria-label="Tổng quan nợ và cho vay">
        <CardContent className="@container/debt-summary min-w-0">
          <div className="grid min-w-0 gap-6 @min-[48rem]/debt-summary:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] @min-[48rem]/debt-summary:items-center @min-[48rem]/debt-summary:gap-8">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <ScaleIcon className="size-4 shrink-0" aria-hidden="true" />
                Cân đối ròng
              </p>
              <p
                className={`mt-2 font-heading text-3xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere] @min-[28rem]/debt-summary:text-4xl ${netClassName}`}
              >
                {formatCurrency(netBalance, {
                  signDisplay: netBalance === 0 ? "auto" : "always",
                })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{netHelper}</p>

              <div className="mt-5 space-y-2">
                <SplitProgress
                  aria-label={
                    total > 0
                      ? `Người khác nợ tôi chiếm ${lentShare}%, tôi đang nợ chiếm ${100 - lentShare}%`
                      : "Chưa có khoản nợ đang mở"
                  }
                  segments={[
                    { value: totalLent, tone: "leaf" },
                    { value: totalBorrowed, tone: "coral" },
                  ]}
                />
                {total > 0 ? (
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#6ecc49]" aria-hidden="true" />
                      Người khác nợ tôi {lentShare}%
                    </span>
                    <span className="flex items-center gap-1.5">
                      Tôi đang nợ {100 - lentShare}%
                      <span className="size-2 rounded-full bg-[#ff645f]" aria-hidden="true" />
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DirectionStat amount={totalLent} debts={debts} direction="lent" />
              <DirectionStat amount={totalBorrowed} debts={debts} direction="borrowed" />
            </div>
          </div>
        </CardContent>
      </section>
    </Card>
  )
}
