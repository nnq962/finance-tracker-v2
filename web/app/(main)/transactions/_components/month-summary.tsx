import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { getTransactionSummary } from "../_lib/get-transaction-summary"
import type { Transaction, TransactionFilter } from "../_types/transaction"

const tiles = [
  { kind: "income", label: "Tiền vào", icon: ArrowDownLeftIcon },
  { kind: "expense", label: "Tiền ra", icon: ArrowUpRightIcon },
] as const

/**
 * The month's money in and money out as two tiles that also switch the list,
 * as in banking apps: a tap shows only that kind, a second tap shows all
 * again. `transactions` are the month's after every filter but the kind, so
 * both tiles keep their figures while one is chosen.
 */
export function MonthSummary({
  transactions,
  filter,
  onFilterChange,
  className,
}: {
  transactions: Transaction[]
  filter: TransactionFilter
  onFilterChange: (filter: TransactionFilter) => void
  className?: string
}) {
  const totals = getTransactionSummary(transactions)
  // Loans move money without being income or spending, as in the totals.
  const count = (kind: "income" | "expense") =>
    transactions.filter((transaction) => transaction.kind === kind && transaction.source !== "debt").length

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {tiles.map((tile) => {
        const selected = filter === tile.kind
        return (
          <Card key={tile.kind} asChild size="sm" variant={selected ? "inverse" : "default"}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onFilterChange(selected ? "all" : tile.kind)}
              className="pressable px-(--card-spacing) text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <span className="flex items-center gap-2">
                <IconTile icon={tile.icon} tone={tile.kind} size="sm" />
                <CardLabel as="span">{tile.label}</CardLabel>
              </span>
              <span className="flex flex-col gap-0.5">
                <Money amount={totals[tile.kind]} size="lg" />
                <CardLabel as="span" className="text-xs">
                  {count(tile.kind)} giao dịch
                </CardLabel>
              </span>
            </button>
          </Card>
        )
      })}
    </div>
  )
}
