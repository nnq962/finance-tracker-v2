"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { Section } from "@/components/app/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CategoryGroup, CategoryType } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import type { MonthAllocation } from "@/lib/overview/month-data"

import { allocationSlices } from "../_lib/allocation-slices"

// The ring is drawn once Recharts has loaded, after the page; until then a
// grey ring of the same size holds its place, and the list beside it is there.
const CategoryDonut = dynamic(() => import("./category-donut").then((module) => module.CategoryDonut), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="aspect-square w-32 shrink-0 rounded-full border-[17px] border-muted" />,
})

/**
 * The month's spending or income by category group: a ring with the total in
 * its middle, and beside it each group's colour, name and share.
 */
export function CategoryBreakdown({
  categoryGroups,
  allocation,
  month,
  today,
}: {
  categoryGroups: CategoryGroup[]
  allocation: Record<string, MonthAllocation>
  /** "YYYY-MM", the month chosen above. */
  month: string
  /** "YYYY-MM-DD" in Vietnam time. */
  today: string
}) {
  const [type, setType] = React.useState<CategoryType>("expense")
  const { slices, total } = allocationSlices(categoryGroups, allocation, month, type)
  const typeLabel = type === "expense" ? "chi" : "thu"
  // Another month than this one is named, so its figures are not taken for
  // this month's (2026-10-17), and "Xem tất cả" opens that month.
  const isThisMonth = month === today.slice(0, 7)
  const [year, monthNumber] = month.split("-").map(Number)
  const monthLabel = `${monthNumber}${year !== Number(today.slice(0, 4)) ? `, ${year}` : ""}`

  return (
    <Section
      title="Theo hạng mục"
      note={isThisMonth ? undefined : `Tháng ${monthLabel}`}
      href={isThisMonth ? "/transactions" : `/transactions?month=${month}`}
    >
      <Tabs value={type} onValueChange={(value) => setType(value as CategoryType)}>
        <TabsList className="w-full">
          <TabsTrigger value="expense">Chi tiêu</TabsTrigger>
          <TabsTrigger value="income">Thu nhập</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card size="lg">
        <CardContent>
          {slices.length > 0 ? (
            <div className="flex items-center gap-6">
              {/* The list beside it says the same for screen readers. */}
              <CategoryDonut slices={slices} total={total} typeLabel={typeLabel} />
              <ul className="min-w-0 flex-1 space-y-2.5">
                {slices.map((slice) => (
                  <li key={slice.key} title={formatCurrency(slice.amount)} className="flex items-center gap-2 text-sm">
                    <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} />
                    <span className="min-w-0 flex-1 truncate">{slice.name}</span>
                    <span className="sr-only">{formatCurrency(slice.amount)},</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{slice.shareLabel}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Empty className="p-4">
              <EmptyHeader>
                <EmptyDescription>Chưa có khoản {typeLabel} {isThisMonth ? "tháng này" : `trong tháng ${monthLabel}`}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </Section>
  )
}
