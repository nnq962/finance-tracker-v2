"use client"

import { useRouter } from "next/navigation"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"
import { cn } from "@/lib/utils"

import { CashFlowChart } from "./overview-charts"

const overdueClassName = "text-[#c8393a] dark:text-[#ff9b93]"

type NetWorthTileProps = {
  icon: LucideIcon
  color: CategoryColorName
  label: string
  value: number
  onClick: () => void
}

/**
 * One of the amounts behind the total, as a tinted tile that opens its page.
 * Three share the card's width, so the amount is shortened; the full one is
 * in the tooltip and the accessible name.
 */
function NetWorthTile({ icon: Icon, color, label, value, onClick }: NetWorthTileProps) {
  return (
    <button
      type="button"
      title={formatCurrency(value)}
      aria-label={`${label}: ${formatCurrency(value)}`}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-start gap-2 rounded-xl p-3 text-left outline-none transition-[filter] hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50 active:brightness-90",
        getCategoryColor(color).surfaceClassName,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="space-y-0.5">
        <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="block font-heading text-base leading-tight font-extrabold text-foreground tabular-nums">
          {formatCompactCurrency(value, 1)}
        </span>
      </span>
    </button>
  )
}

export function NetWorth({ data }: { data: OverviewSummary["netWorth"] }) {
  const router = useRouter()

  return (
    <section aria-labelledby="net-worth-title" className="space-y-2">
      {/* A caption above the card, as on the other sections, so the cards of
          both desktop columns start on one line. */}
      <h2
        id="net-worth-title"
        className="px-3 text-[13px] font-medium text-muted-foreground"
      >
        Tài sản ròng
      </h2>
      {/* One card: the total, then the three amounts it is made of. */}
      <Card>
        <CardContent className="space-y-4">
          <p
            className={cn(
              "font-heading text-4xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere]",
              data.total < 0 && overdueClassName,
            )}
          >
            {formatCurrency(data.total)}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <NetWorthTile
              icon={WalletCardsIcon}
              color="blue"
              label="Tài khoản"
              value={data.cash}
              onClick={() => router.push("/budget")}
            />
            <NetWorthTile
              icon={ArrowDownLeftIcon}
              color="emerald"
              label="Cho vay"
              value={data.receivable}
              onClick={() => router.push("/debts")}
            />
            <NetWorthTile
              icon={ArrowUpRightIcon}
              color="rose"
              label="Đang nợ"
              value={data.payable}
              onClick={() => router.push("/debts")}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

/** Income and expenses over the last six months. */
export function CashFlowTrend({ summary }: { summary: OverviewSummary }) {
  return (
    <section aria-labelledby="cash-flow-trend-title" className="space-y-2">
      <h2
        id="cash-flow-trend-title"
        className="px-3 text-[13px] font-medium text-muted-foreground"
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
