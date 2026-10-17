"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { Money } from "@/components/app/money"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { budgetPace } from "@/lib/budgets/calculations"
import { limitJudges } from "@/lib/budgets/months"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import { monthsBefore } from "./kept-months"

const chartConfig = {
  spent: { label: "Đã chi", color: "var(--foreground)" },
} satisfies ChartConfig

/**
 * The Y axis's marks: nothing, the limit and half of it; when spending runs
 * far past the limit, nothing, the limit and the top instead, so the marks
 * never crowd at the bottom.
 */
function limitTicks(limit: number, top: number) {
  if (top <= limit * 1.4) return [0, limit / 2, limit]
  // A limit close to nothing on this scale: its mark would sit on 0's.
  return limit < top * 0.15 ? [limit, top] : [0, limit, top]
}

function compact(value: number) {
  if (value >= 1_000_000_000) return `${Number((value / 1_000_000_000).toFixed(1)).toLocaleString("vi-VN")}tỷ`
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1)).toLocaleString("vi-VN")}tr`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

/**
 * The Y axis's width for its marks (2026-10-17: a fixed 40 cut "20,9tr"):
 * about 7px a character of the 12px labels, and room to breathe.
 */
function axisWidth(ticks: number[]) {
  return Math.max(32, Math.max(...ticks.map((tick) => compact(tick).length)) * 7 + 10)
}

const monthNumber = (month: string) => Number(month.slice(5))

/*
 * The limit's charts, drawn with Recharts. Only loaded once a limit's detail
 * opens (budget-detail.tsx), so Recharts stays out of the pages' first load
 * (2026-10-17); what the budgets sheet shows before that is in kept-months.tsx.
 */

/**
 * Spent day by day, added up, against the limit as a faint red dashed line
 * (2026-10-17: the straight "đúng kế hoạch" line went, nobody spends that
 * evenly). The running month stops at today; a month gone by runs to its
 * last day, flat after its last spending, and says how it ended. The line is
 * the ink, amber while spending runs fast for the time gone, red once over.
 */
export function BudgetDailyChart({
  daily,
  limit,
  month,
  gone,
  past,
}: {
  daily: number[]
  /** Null for a month before the limit was set: the spending alone. */
  limit: number | null
  /** "YYYY-MM". */
  month: string
  /** Days gone: up to today, or all of a month gone by. */
  gone: number
  past: boolean
}) {
  const days = daily.length
  const added = daily.reduce<number[]>((sums, amount) => [...sums, (sums.at(-1) ?? 0) + amount], [])
  const running = added.at(-1) ?? 0
  const overIndex = limit === null ? -1 : added.findIndex((sum) => sum > limit)
  const overOn = overIndex === -1 ? null : overIndex + 1
  const data = added.map((sum, index) => ({
    day: index + 1,
    spent: index < gone ? sum : undefined,
  }))
  const spent = daily.slice(0, gone).reduce((sum, amount) => sum + amount, 0)
  const tone =
    limit === null
      ? "var(--color-spent)"
      : spent > limit
        ? "var(--expense)"
        : !past && budgetPace(spent, limit, gone / days) === "fast"
          ? "var(--warning)"
          : "var(--color-spent)"
  const date = (day: number) => `${String(day).padStart(2, "0")}/${month.slice(5)}`
  const dailyTicks = limitTicks(limit ?? running, running)

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: tone }} />
            {past ? `Cả tháng ${monthNumber(month)}` : "Đã chi"}
          </dt>
          <dd>
            <Money amount={spent} size="md" tone={limit !== null && spent > limit ? "expense" : "default"} />
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {limit !== null ? <span aria-hidden="true" className="h-0 w-3 border-t-2 border-dashed border-expense/60" /> : null}
            Hạn mức
          </dt>
          <dd>
            {limit === null ? (
              <span className="text-base text-muted-foreground">Chưa đặt</span>
            ) : (
              <Money amount={limit} size="md" tone="muted" />
            )}
          </dd>
        </div>
      </dl>
      <ChartContainer config={chartConfig} aria-hidden className="aspect-auto h-42 w-full">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} verticalCoordinatesGenerator={() => []} strokeDasharray="3 4" />
          <XAxis dataKey="day" ticks={[1, 8, 15, 22, days]} tickLine={false} axisLine={false} tickMargin={8} interval={0} />
          <YAxis
            width={axisWidth(dailyTicks)}
            tickLine={false}
            axisLine={false}
            interval={0}
            ticks={dailyTicks}
            domain={[0, Math.max(limit ?? 0, running, 1) * 1.08]}
            tickFormatter={compact}
          />
          {limit !== null ? <ReferenceLine y={limit} stroke="var(--expense)" strokeOpacity={0.5} strokeDasharray="4 4" /> : null}
          {/* Drawn at once: iOS drops taps while content animates in. */}
          <Area
            dataKey="spent"
            // Smooth (2026-10-17, at the user's wish, after steps looked jagged): monotone, so it never
            // overshoots or dips below a day's sum; it eases up over the day before a spending.
            type="monotoneX"
            stroke={tone}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={tone}
            fillOpacity={0.1}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      {limit === null ? null : spent > limit ? (
        <p className="text-xs font-medium text-expense">
          Vượt hạn mức từ ngày {date(overOn ?? days)}
          {past ? `, cả tháng vượt ${formatCompactCurrency(spent - limit, 1)}` : ""}.
        </p>
      ) : past ? (
        <p className="text-xs font-medium text-income">Cả tháng trong hạn mức, còn dư {formatCompactCurrency(limit - spent, 1)}.</p>
      ) : null}
      <p className="sr-only">
        {past ? `Cả tháng ${monthNumber(month)}` : "Tháng này"} đã chi {formatCurrency(spent)}
        {limit === null ? ", chưa đặt hạn mức." : `, hạn mức ${formatCurrency(limit)}.`}
      </p>
    </div>
  )
}

/**
 * The six months before and the month itself, a column each: past the limit
 * red, the month itself in the ink, the others grey; the limit a dashed
 * line; the average of the tracked months before and the limit above.
 */
export function BudgetMonthsChart({
  history,
  limit,
  month,
  minMonth,
  since,
  past,
}: {
  history: number[]
  limit: number
  month: string
  minMonth: string
  /** "YYYY-MM" the limit was set in: months before it are never red. */
  since: string | null
  past: boolean
}) {
  // Only from the first month with any transaction: empty columns before it read as missing data.
  const data = [...monthsBefore(month, minMonth, since), { key: month, tracked: true, judged: limitJudges(since, month) }]
    .map((entry, index) => ({ ...entry, label: `T${monthNumber(entry.key)}`, spent: history[index], now: index === 6 }))
    .filter((entry) => entry.tracked)
  const before = data.filter((entry) => !entry.now)
  const average = before.length ? Math.round(before.reduce((sum, entry) => sum + entry.spent, 0) / before.length / 1_000) * 1_000 : 0
  const top = Math.max(...data.map((entry) => entry.spent))
  const monthTicks = limitTicks(limit, top).filter((tick) => tick !== limit / 2)

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">
            {before.length > 1 ? `Trung bình ${before.length} tháng trước` : "Tháng trước"}
          </dt>
          <dd>{before.length ? <Money amount={average} size="md" /> : <span className="text-base text-muted-foreground">Chưa có</span>}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Hạn mức</dt>
          <dd>
            <Money amount={limit} size="md" tone="muted" />
          </dd>
        </div>
      </dl>
      <ChartContainer config={chartConfig} aria-hidden className="aspect-auto h-38 w-full">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} accessibilityLayer={false} barCategoryGap="30%">
          <CartesianGrid vertical={false} verticalCoordinatesGenerator={() => []} strokeDasharray="3 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
          <YAxis
            width={axisWidth(monthTicks)}
            tickLine={false}
            axisLine={false}
            interval={0}
            ticks={monthTicks}
            tickFormatter={compact}
            domain={[0, Math.max(limit, top) * 1.1]}
          />
          <ReferenceLine y={limit} stroke="var(--foreground)" strokeOpacity={0.45} strokeDasharray="4 4" />
          {/* A small month next to a large one still shows: at least 4px. */}
          <Bar dataKey="spent" radius={[6, 6, 2, 2]} maxBarSize={28} minPointSize={4} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={
                  entry.judged && entry.spent > limit
                    ? "var(--expense)"
                    : entry.now
                      ? "var(--foreground)"
                      : "var(--chart-neutral)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">
        {past ? "Cột đỏ: vượt hạn mức." : "Cột đỏ: vượt hạn mức. Tháng này tính tới hôm nay."}
      </p>
      <div className="sr-only">
        <table>
          <caption>Chi theo tháng so với hạn mức</caption>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.key}>
                <td>Tháng {monthNumber(entry.key)}</td>
                <td>{formatCurrency(entry.spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** A row of BudgetSplit: a button when it opens something, else plain. */
function SplitRow({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const className = "flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left"
  if (!onClick) return <div className={className}>{children}</div>
  return (
    <button type="button" onClick={onClick} className={cn(className, "transition-colors duration-150 hover:bg-muted active:bg-muted")}>
      {children}
    </button>
  )
}

export type BudgetSplitPart = {
  key: string
  name: string
  amount: number
  /** The slice's colour (a chart fill). */
  fill: string
  /** Under the name, in red: how far the part is past its own limit. */
  over?: string
  /** Opens the part; without it, the row only says it (no chevron). */
  onClick?: () => void
}

/**
 * Where a month's spending went (2026-10-17, as a ring at the user's wish,
 * in place of rows with bars): a ring of the parts with the total in its
 * middle (a tap on a slice shows its name and amount, as the overview's ring does), then a row per
 * part (its colour, name, amount and share, a tap to open it), largest first.
 */
export function BudgetSplit({ parts, total }: { parts: BudgetSplitPart[]; total: number }) {
  const shown = parts.filter((part) => part.amount > 0)
  // Only what the ring draws: Recharts hands each entry's fields to its
  // slice, so a part's onClick would make a tap on the ring open it.
  const slices = shown.map(({ key, name, amount, fill }) => ({ key, name, amount, fill }))
  if (shown.length === 0) return null
  const share = (amount: number) => (total > 0 ? Math.round((amount / total) * 100) : 0)
  return (
    <div className="flex flex-col gap-3">
      {/* The rows below say the same for screen readers. */}
      <ChartContainer config={chartConfig} aria-hidden="true" className="mx-auto aspect-square w-40">
        <PieChart>
          {/* A tap on a slice shows its name and amount, as the overview's ring does; the rows below open it. */}
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="name"
                formatter={(value, _name, item) => (
                  <span className="flex w-full items-center justify-between gap-3 whitespace-nowrap">
                    <span className="text-muted-foreground">{item.payload.name}</span>
                    <span className="font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                  </span>
                )}
              />
            }
          />
          <Pie
            data={slices}
            dataKey="amount"
            nameKey="name"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            cornerRadius={4}
            stroke="var(--card)"
            strokeWidth={slices.length > 1 ? 2 : 0}
            // Drawn at once: iOS drops taps while content animates in.
            isAnimationActive={false}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={slice.fill} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null
                const cy = viewBox.cy ?? 0
                return (
                  <text x={viewBox.cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={cy - 7} className="fill-foreground text-base font-semibold">
                      {formatCompactCurrency(total, 1)}
                    </tspan>
                    <tspan x={viewBox.cx} y={cy + 13} className="fill-muted-foreground text-xs">
                      Tổng chi
                    </tspan>
                  </text>
                )
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="-mx-2 flex flex-col">
        {shown.map((part) => (
          <li key={part.key}>
            <SplitRow onClick={part.onClick}>
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: part.fill }} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm">{part.name}</span>
                {part.over ? <span className="truncate text-xs text-expense">{part.over}</span> : null}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCompactCurrency(part.amount, 1)}</span>
              <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{share(part.amount)}%</span>
              {part.onClick ? <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : <span className="size-4 shrink-0" />}
            </SplitRow>
          </li>
        ))}
      </ul>
    </div>
  )
}
