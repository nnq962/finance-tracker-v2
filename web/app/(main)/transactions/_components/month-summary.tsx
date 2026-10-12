import { summarizeFigures } from "@/lib/transactions/types"
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react"

import { FlowTiles } from "@/components/app/flow-tiles"

import type { Transaction } from "../_types/transaction"

/**
 * The month's money in and money out, the page's lead tiles, figures only: the kind chips above
 * the list narrow it. `transactions` are the month's after every filter but
 * the kind, so both figures stay while a kind is chosen.
 */
export function MonthSummary({
  transactions,
  className,
}: {
  transactions: Transaction[]
  className?: string
}) {
  // Counted as the figures are: a transfer's fee and a loan's interest are rows too.
  const totals = summarizeFigures(transactions)
  const count = (kind: "income" | "expense") => (kind === "income" ? totals.incomeCount : totals.expenseCount)

  return (
    <FlowTiles
      variant="lead"
      className={className}
      tiles={[
        {
          value: "income",
          label: "Thu",
          amount: totals.income,
          caption: `${count("income")} giao dịch`,
          icon: ArrowDownLeftIcon,
          tone: "income",
        },
        {
          value: "expense",
          label: "Chi",
          amount: totals.expense,
          caption: `${count("expense")} giao dịch`,
          icon: ArrowUpRightIcon,
          tone: "expense",
        },
      ]}
    />
  )
}
