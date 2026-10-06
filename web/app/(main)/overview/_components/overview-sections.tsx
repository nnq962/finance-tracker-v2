"use client"

import { useRouter } from "next/navigation"

import { Money } from "@/components/app/money"
import { SectionHeader } from "@/components/app/section-header"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"
import { cn } from "@/lib/utils"

import { CashFlowChart } from "./overview-charts"

const overdueClassName = "text-expense"

type NetWorthPartProps = {
  label: string
  value: number
  onClick: () => void
}

/**
 * One of the amounts behind the total, opening its page. Three share the
 * card's width, so the amount is shortened; the full one is in the tooltip
 * and the accessible name.
 */
function NetWorthPart({ label, value, onClick }: NetWorthPartProps) {
  return (
    <button
      type="button"
      title={formatCurrency(value)}
      aria-label={`${label}: ${formatCurrency(value)}`}
      onClick={onClick}
      className="pressable flex min-h-11 min-w-0 flex-col justify-center text-left outline-none not-first:pl-4 focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <span className="truncate font-medium tabular-nums">{formatCompactCurrency(value, 1)}</span>
      <span className="truncate text-xs text-muted-foreground">{label}</span>
    </button>
  )
}

export function NetWorth({
  data,
  month,
}: {
  data: OverviewSummary["netWorth"]
  /** This month's income and expenses, for what the month has added so far. */
  month: OverviewSummary["cashFlow"]["current"]
}) {
  const router = useRouter()
  const monthNet = month.income - month.expense
  const hasMonth = month.income > 0 || month.expense > 0

  return (
    <Card size="lg" aria-labelledby="net-worth-title" role="region">
      <CardContent>
        <h2 id="net-worth-title" className="text-sm text-muted-foreground">
          Tài sản ròng
        </h2>
        <Money
          amount={data.total}
          size="xl"
          weight="medium"
          tone={data.total < 0 ? "expense" : "default"}
          className="mt-1"
        />
        {hasMonth ? (
          <p className="mt-0.5 text-sm">
            <span
              className={cn(
                "font-medium tabular-nums",
                monthNet > 0 ? "text-income" : monthNet < 0 ? "text-expense" : undefined,
              )}
            >
              {monthNet > 0 ? "+" : monthNet < 0 ? "−" : ""}
              {formatCompactCurrency(Math.abs(monthNet), 1)}
            </span>
            <span className="ml-1.5 text-muted-foreground">thu chi tháng này</span>
          </p>
        ) : null}
        <div className="mt-5 grid grid-cols-3 divide-x">
          <NetWorthPart label="Tài khoản" value={data.cash} onClick={() => router.push("/budget")} />
          <NetWorthPart label="Cho vay" value={data.receivable} onClick={() => router.push("/debts")} />
          <NetWorthPart label="Đang nợ" value={data.payable} onClick={() => router.push("/debts")} />
        </div>
      </CardContent>
    </Card>
  )
}

/** Income and expenses over the last six months. */
export function CashFlowTrend({ summary }: { summary: OverviewSummary }) {
  return (
    <Card size="lg" role="region" aria-labelledby="cash-flow-trend-title">
      <CardContent className="flex items-center justify-between gap-3">
        <h2 id="cash-flow-trend-title" className="font-medium">
          Thu chi 6 tháng
        </h2>
        {summary.cashFlow.hasActivity ? (
          <p aria-hidden="true" className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-income" />
              Thu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-expense" />
              Chi
            </span>
          </p>
        ) : null}
      </CardContent>
      <CardContent>
        {summary.cashFlow.hasActivity ? (
          <CashFlowChart data={summary.cashFlow} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyDescription>Chưa có thu chi.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words

  return letters.map((word) => word[0]).join("").toUpperCase() || "?"
}

function getDueLabel(daysUntilDue: number) {
  if (daysUntilDue < 0) return `Quá ${Math.abs(daysUntilDue)} ngày`
  if (daysUntilDue === 0) return "Đến hạn hôm nay"
  return `Còn ${daysUntilDue} ngày`
}

/** Debts due within two weeks; hidden when there are none. */
export function DueDebts({ debts }: { debts: OverviewSummary["dueDebts"] }) {
  const router = useRouter()

  if (debts.length === 0) return null

  return (
    <section aria-labelledby="due-debts-title" className="space-y-2">
      <SectionHeader title={<span id="due-debts-title">Sắp đến hạn</span>} href="/debts" />
      <SettingsGroup size="lg">
        {debts.map((debt) => (
          <SettingsRow
            key={debt.id}
            media={
              <Avatar size="lg">
                <AvatarFallback>{getInitials(debt.contactName)}</AvatarFallback>
              </Avatar>
            }
            title={debt.contactName}
            description={debt.direction === "lent" ? "Cho vay" : "Đi vay"}
            chevron={false}
            action={
              <span className="flex flex-col items-end">
                <Money amount={debt.remainingAmount} size="sm" weight="medium" />
                <span
                  className={cn(
                    "text-xs text-muted-foreground",
                    debt.daysUntilDue <= 0 && overdueClassName,
                  )}
                >
                  {getDueLabel(debt.daysUntilDue)}
                </span>
              </span>
            }
            onClick={() => router.push(`/debts?debt=${encodeURIComponent(debt.id)}`)}
          />
        ))}
      </SettingsGroup>
    </section>
  )
}
