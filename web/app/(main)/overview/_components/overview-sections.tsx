"use client"

import { useRouter } from "next/navigation"

import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Section } from "@/components/app/section-header"
import { Stat, StatGroup } from "@/components/app/stat-group"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Card, CardContent } from "@/components/ui/card"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"
import { cn } from "@/lib/utils"

import { ContactAvatar } from "../../debts/_components/contact-avatar"

const overdueClassName = "text-expense"

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
    <Card size="lg" variant="inverse" aria-labelledby="net-worth-title" role="region">
      <CardContent>
        <CardLabel id="net-worth-title">Tài sản ròng</CardLabel>
        <Money amount={data.total} size="xl" tone={data.total < 0 ? "expense" : "default"} className="mt-1.5" />
        {hasMonth ? (
          <p className="mt-0.5 text-sm">
            <span
              className={cn(
                "font-semibold tabular-nums",
                monthNet > 0 ? "text-income" : monthNet < 0 ? "text-expense" : undefined,
              )}
            >
              {monthNet > 0 ? "+" : monthNet < 0 ? "−" : ""}
              {formatCompactCurrency(Math.abs(monthNet), 1)}
            </span>
            <CardLabel as="span" className="ml-1.5">
              tháng này
            </CardLabel>
          </p>
        ) : null}
        {/* Three share the card's width, so the amounts are shortened; the
            full ones are in the tooltip and the accessible name. */}
        <StatGroup separated className="mt-5">
          {(
            [
              ["Tài khoản", data.cash, "/budget"],
              ["Cho vay", data.receivable, "/debts"],
              ["Đang nợ", data.payable, "/debts"],
            ] as const
          ).map(([label, value, href]) => (
            <Stat
              key={label}
              label={label}
              value={formatCompactCurrency(value, 1)}
              title={formatCurrency(value)}
              onClick={() => router.push(href)}
            />
          ))}
        </StatGroup>
      </CardContent>
    </Card>
  )
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
    <Section title="Sắp đến hạn" href="/debts">
      <SettingsGroup size="lg">
        {debts.map((debt) => (
          <SettingsRow
            key={debt.id}
            media={<ContactAvatar contactId={debt.contactId} initials={debt.contactInitials} />}
            title={debt.contactName}
            description={debt.direction === "lent" ? "Cho vay" : "Đi vay"}
            action={
              <span className="flex flex-col items-end">
                <Money amount={debt.remainingAmount} size="sm" />
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
    </Section>
  )
}
