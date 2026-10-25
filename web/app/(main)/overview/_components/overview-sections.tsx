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
import { debtsUrl } from "@/lib/debts/debts-url"

import { ContactAvatar } from "../../debts/_components/contact-avatar"
import { EyeToggle, Hideable, HIDDEN_FIGURE } from "./hide-balance"

const overdueClassName = "text-expense"

/**
 * Where net worth stood at the end of each of the months shown, oldest first,
 * then now: today's total less what each later month added (income less
 * spending). A sketch of the trend, not a ledger: transfers and a debt's
 * principal move nothing here, so the card shows its shape, never its values.
 */
function netWorthTrend(total: number, months: OverviewSummary["cashFlow"]["months"]) {
  const points = [total]
  let value = total
  for (let index = months.length - 1; index >= 0; index -= 1) {
    value -= months[index].income - months[index].expense
    points.unshift(value)
  }
  return points
}

/**
 * The lead card's accent (2026-10-25, the user's ask): net worth over the six
 * months as a thin line in Timi's lime, the brand's rising bars said as data,
 * ending on a dot at today. No axis or figures (it is an estimate, see
 * netWorthTrend); faded out while the figures are hidden, its shape would tell.
 */
function NetWorthSpark({ points, hidden }: { points: number[]; hidden: boolean }) {
  const low = Math.min(...points)
  const high = Math.max(...points)
  const span = high - low || 1
  const x = (index: number) => (index / (points.length - 1)) * 100
  const y = (value: number) => 22 - ((value - low) / span) * 20
  const line = points.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(2)},${y(value).toFixed(2)}`).join(" ")
  const last = points[points.length - 1]
  return (
    <div aria-hidden="true" className={cn("relative mt-4 h-12 transition-opacity duration-200 ease-out", hidden && "opacity-0")}>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <path d={`${line} L100,24 L0,24 Z`} className="fill-ai/12" />
        <path d={line} fill="none" stroke="var(--ai)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ai ring-[3px] ring-card"
        style={{ left: "100%", top: `${(y(last) / 24) * 100}%` }}
      />
    </div>
  )
}

/**
 * Tài sản ròng, the page's lead: on Card variant "lead" (2026-10-25, the
 * user's ask: black in the light theme, a step lighter than the cards in the
 * dark), the figure, its six months as a lime line, then the accounts, what is
 * lent and what is owed as tiles. The eye in the card's top right corner hides
 * the figures (Ẩn số dư); "thu − chi tháng này" left it the same day.
 */
export function NetWorth({
  data,
  months,
  hidden = false,
  onToggleHidden,
}: {
  data: OverviewSummary["netWorth"]
  /** The six months, for the trend line; without them (the landing's sample) none. */
  months?: OverviewSummary["cashFlow"]["months"]
  hidden?: boolean
  /** The eye; without it (the landing's sample) the card has none. */
  onToggleHidden?: () => void
}) {
  const trend = months && months.length > 1 ? netWorthTrend(data.total, months) : null

  return (
    <Card size="lg" variant="lead" aria-labelledby="net-worth-title" role="region" className="relative">
      {onToggleHidden ? (
        // In the card's top right corner, level with the label (2026-10-25), clear of the figure and, from lg, of the tiles below.
        <div className="absolute top-(--card-spacing) right-(--card-spacing)">
          <EyeToggle hidden={hidden} onToggle={onToggleHidden} />
        </div>
      ) : null}
      {/* From lg the card runs across the page: the figure on the left, its three parts on the right (2026-10-20). */}
      <CardContent className="lg:flex lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 lg:flex-1">
          <CardLabel id="net-worth-title" className="flex h-6 items-center">
            Tài sản ròng
          </CardLabel>
          {/* Fits its line, as the accounts page's total: from 10 tỷ it reached the card's edge (2026-10-17). */}
          <div className="@container mt-1.5 flex min-h-[42.5px] items-center">
            <Hideable
              hidden={hidden}
              inline={false}
              dots={
                <span className="text-[34px] leading-tight font-semibold md:text-[44px]">
                  {HIDDEN_FIGURE}
                  <span className="text-[20px] tracking-normal opacity-50 md:text-[26px]">đ</span>
                </span>
              }
            >
              <Money amount={data.total} size="display" fit tone={data.total < 0 ? "expense" : "default"} />
            </Hideable>
          </div>
          {data.leftOut.count > 0 ? (
            <CardLabel as="p" className="mt-1.5 text-pretty">
              {data.leftOut.count} tài khoản ngoài báo cáo
              {hidden ? null : ` · ${formatCompactCurrency(data.leftOut.cash, 1)}`}
              {!hidden && data.leftOut.receivable > 0 ? `, cho vay ${formatCompactCurrency(data.leftOut.receivable, 1)}` : null}
              {!hidden && data.leftOut.payable > 0 ? `, đang nợ ${formatCompactCurrency(data.leftOut.payable, 1)}` : null}
            </CardLabel>
          ) : null}
          {trend ? <NetWorthSpark points={trend} hidden={hidden} /> : null}
        </div>
        {/* Three share the card's width, so the amounts are shortened; the
            full ones are in the tooltip and the accessible name. */}
        <StatGroup tiles className="mt-5 lg:mt-0 lg:w-[30rem] lg:shrink-0">
          {(
            [
              ["Tài khoản", data.cash, "/budget"],
              ["Cho vay", data.receivable, debtsUrl()],
              ["Đang nợ", data.payable, debtsUrl()],
            ] as const
          ).map(([label, value, href]) => (
            <Stat
              key={label}
              label={label}
              value={
                <Hideable hidden={hidden} dots="•••">
                  {formatCompactCurrency(value, 1)}
                </Hideable>
              }
              title={hidden ? undefined : formatCurrency(value)}
              href={href}
            />
          ))}
        </StatGroup>
      </CardContent>
    </Card>
  )
}

function getDueLabel(daysUntilDue: number) {
  if (daysUntilDue < 0) return `Quá hạn ${Math.abs(daysUntilDue)} ngày`
  if (daysUntilDue === 0) return "Đến hạn hôm nay"
  return `Còn ${daysUntilDue} ngày`
}

/** Debts due within two weeks; hidden when there are none. */
export function DueDebts({ debts }: { debts: OverviewSummary["dueDebts"] }) {
  const router = useRouter()

  if (debts.length === 0) return null

  return (
    <Section title="Sắp đến hạn" href={debtsUrl()}>
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
            onClick={() => router.push(debtsUrl(debt.id))}
          />
        ))}
      </SettingsGroup>
    </Section>
  )
}
