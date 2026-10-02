"use client"

import { useRouter } from "next/navigation"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
} from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import type { OverviewSummary } from "@/lib/overview/summary"
import { cn } from "@/lib/utils"

import { CashFlowChart } from "./overview-charts"

const MAX_SPENDING_GROUPS = 5

const overdueClassName = "text-[#c8393a] dark:text-[#ff9b93]"

export function NetWorth({ data }: { data: OverviewSummary["netWorth"] }) {
  const router = useRouter()

  return (
    <section aria-labelledby="net-worth-title" className="space-y-4">
      <Card>
        <CardContent>
          <h2 id="net-worth-title" className="text-sm text-muted-foreground">
            Tài sản ròng
          </h2>
          <p
            className={cn(
              "font-heading text-4xl leading-tight font-extrabold tracking-tight tabular-nums [overflow-wrap:anywhere]",
              data.total < 0 && overdueClassName,
            )}
          >
            {formatCurrency(data.total)}
          </p>
        </CardContent>
      </Card>
      <SettingsGroup>
        <SettingsRow
          icon={WalletCardsIcon}
          color="blue"
          title="Số dư tài khoản"
          value={formatCurrency(data.cash)}
          onClick={() => router.push("/budget")}
        />
        <SettingsRow
          icon={ArrowDownLeftIcon}
          color="emerald"
          title="Người khác nợ tôi"
          value={formatCurrency(data.receivable)}
          onClick={() => router.push("/debts")}
        />
        <SettingsRow
          icon={ArrowUpRightIcon}
          color="rose"
          title="Tôi đang nợ"
          value={formatCurrency(data.payable)}
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

export function Spending({
  categoryGroups,
  summary,
}: {
  categoryGroups: CategoryGroup[]
  summary: OverviewSummary
}) {
  const total = summary.cashFlow.current.expense
  const groupsById = new Map(categoryGroups.map((group) => [group.id, group]))
  const topGroups = summary.spending.slice(0, MAX_SPENDING_GROUPS)

  return (
    <SettingsGroup title={`Chi theo nhóm · ${summary.monthLabel}`}>
      {topGroups.length ? (
        topGroups.map((item) => {
          const group = groupsById.get(item.id)
          const share = total > 0 ? Math.round((item.amount / total) * 100) : 0

          return (
            <SettingsRow
              key={item.id}
              icon={group ? categoryIconRegistry[group.iconName] : ReceiptTextIcon}
              color={group?.colorName ?? "slate"}
              title={item.name}
              description={`${share}% tổng chi`}
              value={formatCurrency(item.amount)}
            />
          )
        })
      ) : (
        <SettingsRow title="Chưa có chi tiêu tháng này" />
      )}
    </SettingsGroup>
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
