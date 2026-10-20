"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { Money } from "@/components/app/money"
import { formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"

import { axisTicks, axisWidth, type CashFlowMonth } from "../_lib/cash-flow-axis"

// The bars are drawn once Recharts has loaded, after the page; the readout
// and the month buttons are already there, and the space is kept meanwhile.
const CashFlowBars = dynamic(() => import("./cash-flow-bars").then((module) => module.CashFlowBars), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-44 w-full sm:h-56" />,
})

/**
 * The selected month's figures, read out above the bars in place of a
 * floating tooltip. The month and the figures always take two lines, so the
 * bars stay put under the finger whatever the amounts' length: each figure
 * has half the width and fits it (from 1 tỷ up they wrapped at 360px,
 * 2026-10-17).
 */
function MonthReadout({ month }: { month: CashFlowMonth }) {
  return (
    <div aria-live="polite" aria-atomic className="flex flex-col gap-0.5">
      <p className="font-medium">{month.name}</p>
      <dl className="grid grid-cols-2 gap-x-3">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <dt className="text-xs text-muted-foreground">Thu</dt>
          <dd className="@container min-w-0 flex-1">
            <Money amount={month.income} size="md" fit tone={month.income > 0 ? "income" : "default"} />
          </dd>
        </div>
        <div className="flex min-w-0 items-baseline gap-1.5">
          <dt className="text-xs text-muted-foreground">Chi</dt>
          <dd className="@container min-w-0 flex-1">
            <Money amount={month.expense} size="md" fit />
          </dd>
        </div>
      </dl>
    </div>
  )
}

/**
 * Income and expenses for each of the last six months. A tap on a month
 * selects it, as in a native chart: its figures show in the readout and its
 * column is shaded. The current month is selected to begin with.
 */
export function CashFlowChart({ data }: { data: OverviewSummary["cashFlow"] }) {
  const [selectedKey, setSelectedKey] = React.useState<string>()
  const found = data.months.findIndex((month) => month.key === selectedKey)
  // The last month is the current one.
  const selectedIndex = found === -1 ? data.months.length - 1 : found
  const selected = data.months[selectedIndex]
  const ticks = axisTicks(data.months)
  const yAxisWidth = axisWidth(ticks)

  return (
    <div className="flex flex-col gap-4">
      <MonthReadout month={selected} />
      <div className="relative">
        {/* The month buttons below and the table after them are what assistive
            technology reads; the drawing itself is hidden from it. */}
        <CashFlowBars months={data.months} selected={selected} ticks={ticks} yAxisWidth={yAxisWidth} />
        {/* A month's whole column, labels included, takes the tap: the bars
            alone are too thin to aim at, and an empty month has none. The
            columns match the X axis's equal bands right of the Y axis. A
            radio group, so arrow keys move the choice along with the focus. */}
        <RadioGroupPrimitive.Root
          value={selected.key}
          onValueChange={setSelectedKey}
          aria-label="Chọn tháng"
          className="absolute inset-y-0 right-0 flex"
          style={{ left: yAxisWidth }}
        >
          {data.months.map((month) => (
            <RadioGroupPrimitive.Item
              key={month.key}
              value={month.key}
              aria-label={month.name}
              // The chosen month's column is shaded, as in Health: the bars keep
              // full colour, so every month stays readable against the card.
              className="min-w-0 flex-1 rounded-xl outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/30 data-[state=checked]:bg-foreground/5 motion-reduce:transition-none"
            />
          ))}
        </RadioGroupPrimitive.Root>
      </div>
      {/* sr-only on a div: a table cannot shrink to 1px and would stretch the
          page's scroll area below the content. */}
      <div className="sr-only">
        <table>
          <caption>Thu và chi 6 tháng gần nhất</caption>
          <thead>
            <tr><th>Tháng</th><th>Thu</th><th>Chi</th></tr>
          </thead>
          <tbody>
            {data.months.map((month) => (
              <tr key={month.key}>
                <td>{month.name}</td>
                <td>{formatCurrency(month.income)}</td>
                <td>{formatCurrency(month.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
