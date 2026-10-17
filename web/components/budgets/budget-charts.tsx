"use client"

import { ChevronRightIcon } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { Money } from "@/components/app/money"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { budgetPace } from "@/lib/budgets/calculations"
import { shiftMonthKey } from "@/lib/budgets/months"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

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
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1)).toLocaleString("vi-VN")}tr`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

const monthNumber = (month: string) => Number(month.slice(5))

/** The six months before `month`, oldest first, and whether each is tracked (on or after the first transaction). */
function monthsBefore(month: string, minMonth: string) {
  return Array.from({ length: 6 }, (_, index) => {
    const key = shiftMonthKey(month, index - 6)
    return { key, tracked: key >= minMonth }
  })
}

/**
 * How many of the six months before stayed within the limit, then a dot for
 * each, oldest first: green kept, red over, grey before the user had any
 * transaction (not counted). Nothing while none of them is tracked.
 */
export function KeptMonths({
  history,
  limit,
  month,
  minMonth,
  className,
}: {
  /** The six months before, then the month itself (BudgetMonthLine). */
  history: number[]
  limit: number
  month: string
  minMonth: string
  className?: string
}) {
  const months = monthsBefore(month, minMonth).map((entry, index) => ({ ...entry, spent: history[index] }))
  const tracked = months.filter((entry) => entry.tracked)
  if (tracked.length === 0) return null
  const kept = tracked.filter((entry) => entry.spent <= limit).length
  return (
    <div className={cn("flex items-center justify-between gap-3 text-xs text-muted-foreground", className)}>
      <span>
        Trong hạn mức{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {kept}/{tracked.length}
        </span>{" "}
        tháng trước
      </span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {months.map((entry) => (
          <span
            key={entry.key}
            className={cn("size-2 rounded-full", !entry.tracked ? "bg-muted" : entry.spent <= limit ? "bg-income" : "bg-expense")}
          />
        ))}
      </span>
    </div>
  )
}

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
  limit: number
  /** "YYYY-MM". */
  month: string
  /** Days gone: up to today, or all of a month gone by. */
  gone: number
  past: boolean
}) {
  const days = daily.length
  const added = daily.reduce<number[]>((sums, amount) => [...sums, (sums.at(-1) ?? 0) + amount], [])
  const running = added.at(-1) ?? 0
  const overIndex = added.findIndex((sum) => sum > limit)
  const overOn = overIndex === -1 ? null : overIndex + 1
  const data = added.map((sum, index) => ({
    day: index + 1,
    spent: index < gone ? sum : undefined,
  }))
  const spent = daily.slice(0, gone).reduce((sum, amount) => sum + amount, 0)
  const tone =
    spent > limit
      ? "var(--expense)"
      : !past && budgetPace(spent, limit, gone / days) === "fast"
        ? "var(--warning)"
        : "var(--color-spent)"
  const date = (day: number) => `${String(day).padStart(2, "0")}/${month.slice(5)}`

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: tone }} />
            {past ? `Cả tháng ${monthNumber(month)}` : "Đã chi"}
          </dt>
          <dd>
            <Money amount={spent} size="md" tone={spent > limit ? "expense" : "default"} />
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true" className="h-0 w-3 border-t-2 border-dashed border-expense/60" />
            Hạn mức
          </dt>
          <dd>
            <Money amount={limit} size="md" tone="muted" />
          </dd>
        </div>
      </dl>
      <ChartContainer config={chartConfig} aria-hidden className="aspect-auto h-42 w-full">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} verticalCoordinatesGenerator={() => []} strokeDasharray="3 4" />
          <XAxis dataKey="day" ticks={[1, 8, 15, 22, days]} tickLine={false} axisLine={false} tickMargin={8} interval={0} />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            interval={0}
            ticks={limitTicks(limit, running)}
            domain={[0, Math.max(limit, running) * 1.08]}
            tickFormatter={compact}
          />
          <ReferenceLine y={limit} stroke="var(--expense)" strokeOpacity={0.5} strokeDasharray="4 4" />
          {/* Drawn at once: iOS drops taps while content animates in. */}
          <Area
            dataKey="spent"
            type="monotone"
            stroke={tone}
            strokeWidth={2}
            fill={tone}
            fillOpacity={0.1}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      {spent > limit ? (
        <p className="text-xs font-medium text-expense">
          Vượt hạn mức từ ngày {date(overOn ?? days)}
          {past ? `, cả tháng vượt ${formatCompactCurrency(spent - limit, 1)}` : ""}.
        </p>
      ) : past ? (
        <p className="text-xs font-medium text-income">Cả tháng trong hạn mức, còn dư {formatCompactCurrency(limit - spent, 1)}.</p>
      ) : null}
      <p className="sr-only">
        {past ? `Cả tháng ${monthNumber(month)}` : "Tháng này"} đã chi {formatCurrency(spent)}, hạn mức {formatCurrency(limit)}.
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
  past,
}: {
  history: number[]
  limit: number
  month: string
  minMonth: string
  past: boolean
}) {
  const before = monthsBefore(month, minMonth)
  const tracked = before.map((entry, index) => ({ ...entry, spent: history[index] })).filter((entry) => entry.tracked)
  const average = tracked.length ? Math.round(tracked.reduce((sum, entry) => sum + entry.spent, 0) / tracked.length / 1_000) * 1_000 : 0
  const data = [...before.map((entry) => entry.key), month].map((key, index) => ({
    key,
    label: `T${monthNumber(key)}`,
    spent: history[index],
    now: index === 6,
  }))

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">
            {tracked.length ? `Trung bình ${tracked.length} tháng trước` : "Các tháng trước"}
          </dt>
          <dd>{tracked.length ? <Money amount={average} size="md" /> : <span className="text-base text-muted-foreground">Chưa có</span>}</dd>
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
            width={40}
            tickLine={false}
            axisLine={false}
            interval={0}
            ticks={limitTicks(limit, Math.max(...data.map((entry) => entry.spent))).filter((tick) => tick !== limit / 2)}
            tickFormatter={compact}
            domain={[0, Math.max(limit, ...data.map((entry) => entry.spent)) * 1.1]}
          />
          <ReferenceLine y={limit} stroke="var(--foreground)" strokeOpacity={0.45} strokeDasharray="4 4" />
          <Bar dataKey="spent" radius={[6, 6, 2, 2]} maxBarSize={28} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={entry.spent > limit ? "var(--expense)" : entry.now ? "var(--foreground)" : "var(--chart-neutral)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">
        Cột đỏ là tháng vượt hạn mức{past ? "" : "; tháng này tính tới hôm nay"}.
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

export type BudgetSplitPart = {
  key: string
  name: string
  amount: number
  /** The slice's colour (a chart fill). */
  fill: string
  /** Under the name, in red: how far the part is past its own limit. */
  over?: string
  onClick: () => void
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
            <button
              type="button"
              onClick={part.onClick}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left transition-colors duration-150 hover:bg-muted active:bg-muted"
            >
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: part.fill }} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm">{part.name}</span>
                {part.over ? <span className="truncate text-xs text-expense">{part.over}</span> : null}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCompactCurrency(part.amount, 1)}</span>
              <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{share(part.amount)}%</span>
              <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
