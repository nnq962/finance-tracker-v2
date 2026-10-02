"use client"

import { useRouter } from "next/navigation"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  WalletCardsIcon,
} from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"
import { cn } from "@/lib/utils"

import { cashFlowColors } from "../../transactions/_lib/transaction-presentation"
import { CashFlowChart } from "./overview-charts"

const overdueClassName = "text-[#c8393a] dark:text-[#ff9b93]"

/** An amount in a net-worth row; the sign shows how it enters the total. */
function NetWorthAmount({ value, sign }: { value: number; sign?: "+" | "−" }) {
  return (
    <span
      className={cn(
        "font-heading font-extrabold tabular-nums",
        value === 0
          ? "text-muted-foreground"
          : sign === "+"
            ? cashFlowColors.income.text
            : sign === "−"
              ? cashFlowColors.expense.text
              : "text-foreground",
      )}
    >
      {value !== 0 ? sign : null}
      {formatCurrency(value)}
    </span>
  )
}

export function NetWorth({ data }: { data: OverviewSummary["netWorth"] }) {
  const router = useRouter()
  // The total sits on a band in its sign's colour: green when positive, red
  // when negative, neutral at zero.
  const bandClassName =
    data.total > 0
      ? cashFlowColors.income.surface
      : data.total < 0
        ? cashFlowColors.expense.surface
        : "bg-[#f3f1ec] dark:bg-muted/50"

  return (
    <section aria-labelledby="net-worth-title" className="space-y-2">
      {/* A caption above the card, as on the other sections, so the cards of
          both desktop columns start on one line. */}
      <h2
        id="net-worth-title"
        className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        Tài sản ròng
      </h2>
      {/* One card: the total, then the three amounts it is made of. */}
      <SettingsGroup
        header={
          <div className={cn("px-4 py-5", bandClassName)}>
            <p className="font-heading text-4xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere]">
              {formatCurrency(data.total)}
            </p>
          </div>
        }
      >
        <SettingsRow
          icon={WalletCardsIcon}
          color="blue"
          title="Số dư tài khoản"
          value={<NetWorthAmount value={data.cash} />}
          onClick={() => router.push("/budget")}
        />
        <SettingsRow
          icon={ArrowDownLeftIcon}
          color="emerald"
          title="Người khác nợ tôi"
          value={<NetWorthAmount value={data.receivable} sign="+" />}
          onClick={() => router.push("/debts")}
        />
        <SettingsRow
          icon={ArrowUpRightIcon}
          color="rose"
          title="Tôi đang nợ"
          value={<NetWorthAmount value={data.payable} sign="−" />}
          onClick={() => router.push("/debts")}
        />
      </SettingsGroup>
    </section>
  )
}

/** Income and expenses over the last six months. */
export function CashFlowTrend({ summary }: { summary: OverviewSummary }) {
  return (
    <section aria-labelledby="cash-flow-trend-title" className="space-y-2">
      <h2
        id="cash-flow-trend-title"
        className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        Thu chi 6 tháng
      </h2>
      <Card>
        <CardContent>
          {summary.cashFlow.hasActivity ? (
            <CashFlowChart data={summary.cashFlow} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Chưa có thu chi.</p>
          )}
        </CardContent>
      </Card>
    </section>
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
    <SettingsGroup title="Sắp đến hạn">
      {debts.map((debt) => (
        <SettingsRow
          key={debt.id}
          media={
            <Avatar>
              <AvatarFallback>{getInitials(debt.contactName)}</AvatarFallback>
            </Avatar>
          }
          title={debt.contactName}
          description={debt.direction === "lent" ? "Cho vay" : "Đi vay"}
          action={
            <span className="flex flex-col items-end">
              <span className="font-heading text-sm font-extrabold tabular-nums">
                {formatCurrency(debt.remainingAmount)}
              </span>
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
  )
}
