"use client"

import { CardLabel } from "@/components/app/card-label"
import { Collapse } from "@/components/app/collapse"
import { DeltaBadge } from "@/components/app/delta-badge"
import { Money } from "@/components/app/money"
import { Section } from "@/components/app/section-header"
import { SoftSwap } from "@/components/app/soft-swap"
import { Card, CardContent } from "@/components/ui/card"
import { formatCompactCurrency } from "@/lib/format-currency"
import type { DayTotals } from "@/lib/overview/month-data"
import { cn } from "@/lib/utils"

import { shiftMonth } from "./cash-flow-calendar"
import { HIDDEN_FIGURE } from "./hide-balance"

/** Each day's running total of spending in `month` ("YYYY-MM"), from the 1st to day `last`, as the calendar counts it. */
function runningSpend(days: Record<string, DayTotals>, month: string, last: number) {
  const totals: number[] = []
  let total = 0
  for (let index = 1; index <= last; index += 1) {
    total += days[`${month}-${String(index).padStart(2, "0")}`]?.expense ?? 0
    totals.push(total)
  }
  return totals
}

function daysIn(month: string) {
  const [year, number] = month.split("-").map(Number)
  return new Date(Date.UTC(year, number, 0)).getUTCDate()
}

/**
 * So với tháng trước (2026-10-25, the user's pick of the overview mockup):
 * what this month has spent so far, its change against the same days of last
 * month (DeltaBadge, green when lower) and one sentence, then the two months as
 * running totals on one small chart, as Copilot and Revolut show a month's
 * pace: this month a firm ink line up to today ending on a dot, last month a
 * soft grey line over its whole month with its value on the same day marked.
 * No axes: the 1st and the month's end under it. With the figures hidden (Ẩn
 * số dư) the figure and the sentence cross-blur to dots and the chart folds
 * away, its heights would tell.
 */
export function VersusLastMonth({ days, today, hidden }: { days: Record<string, DayTotals>; today: string; hidden: boolean }) {
  const month = today.slice(0, 7)
  const day = Number(today.slice(8, 10))
  const previous = shiftMonth(month, -1)
  const monthNumber = Number(month.slice(5, 7))
  const previousNumber = Number(previous.slice(5, 7))
  const length = Math.max(daysIn(month), daysIn(previous))
  const now = runningSpend(days, month, day)
  const then = runningSpend(days, previous, daysIn(previous))
  const nowTotal = now[now.length - 1] ?? 0
  const sameDay = then[Math.min(day, then.length) - 1] ?? 0
  const top = Math.max(...now, ...then, 1)
  const difference = nowTotal - sameDay
  const sentence =
    sameDay === 0
      ? `Tháng ${previousNumber} chưa chi gì tới ngày ${day}.`
      : difference === 0
        ? `Bằng cùng kỳ tháng ${previousNumber}.`
        : `${difference < 0 ? "Ít" : "Nhiều"} hơn ${formatCompactCurrency(Math.abs(difference), 1)} so với cùng kỳ tháng ${previousNumber}.`

  // The chart's frame: 100 wide by 40 tall, stretched to the card; the lines keep their width.
  const x = (index: number) => (length > 1 ? (index / (length - 1)) * 100 : 0)
  const y = (value: number) => 38 - (value / top) * 34
  const line = (values: number[]) => values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(2)},${y(value).toFixed(2)}`).join(" ")
  const area = `${line(now)} L${x(now.length - 1).toFixed(2)},40 L0,40 Z`
  const dot = { left: `${x(now.length - 1)}%`, top: `${(y(nowTotal) / 40) * 100}%` }
  const mark = { left: `${x(Math.min(day, then.length) - 1)}%`, top: `${(y(sameDay) / 40) * 100}%` }

  return (
    // Beside the missions card, which has no title above it, the title moves into the card
    // from lg (2026-10-25), so both columns start on a card edge; without it, outside as before.
    <Section
      title="So với tháng trước"
      className="lg:group-has-[[data-overview-missions]:not(:empty)]/overview:[&>:first-child]:hidden lg:group-has-[[data-overview-missions]:not(:empty)]/overview:[&>:last-child]:mt-0"
    >
      <Card>
        <CardContent>
          <p
            aria-hidden="true"
            className="mb-3 hidden text-base font-semibold lg:group-has-[[data-overview-missions]:not(:empty)]/overview:block"
          >
            So với tháng trước
          </p>
          <div className="flex items-center justify-between gap-3">
            <CardLabel>Đã chi tháng {monthNumber}</CardLabel>
            <span className={cn("transition-opacity duration-200 ease-out", hidden && "opacity-0")}>
              <DeltaBadge current={nowTotal} previous={sameDay} goodWhen="down" comparedTo={`cùng kỳ tháng ${previousNumber}`} />
            </span>
          </div>
          <div className="mt-1 flex min-h-7 items-center">
            <SoftSwap value={hidden ? "hidden" : "shown"}>
              {(state) =>
                state === "hidden" ? (
                  <span className="text-xl font-semibold tracking-[-0.12em]">{HIDDEN_FIGURE}</span>
                ) : (
                  <Money amount={nowTotal} sign="never" size="lg" />
                )
              }
            </SoftSwap>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <SoftSwap value={hidden ? "hidden" : "shown"}>{(state) => (state === "hidden" ? `So với cùng kỳ tháng ${previousNumber}.` : sentence)}</SoftSwap>
          </p>

          <Collapse open={!hidden}>
            <div className="pt-5">
              <div className="relative h-24">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                  <path d={line(then)} fill="none" stroke="var(--chart-neutral)" strokeOpacity={0.55} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <path d={area} className="fill-foreground/[0.06]" />
                  <path d={line(now)} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
                {/* Last month on the same day, a hollow mark; today, a solid dot ringed by the card. */}
                <span aria-hidden="true" className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card ring-2 ring-chart-neutral" style={mark} />
                <span aria-hidden="true" className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-[3px] ring-card" style={dot} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground tabular-nums">
                <span>1/{monthNumber}</span>
                <span>
                  {length}/{monthNumber}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-foreground" />
                  Tháng {monthNumber}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-chart-neutral" />
                  Tháng {previousNumber} · cùng kỳ {formatCompactCurrency(sameDay, 1)}
                </span>
              </div>
            </div>
          </Collapse>
        </CardContent>
      </Card>
    </Section>
  )
}
