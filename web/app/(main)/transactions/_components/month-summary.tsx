import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react"

import { FlowTiles } from "@/components/app/flow-tiles"

import { getTransactionSummary } from "../_lib/get-transaction-summary"
import type { Transaction } from "../_types/transaction"

/**
 * The month's money in and money out, as figures only: the kind chips above
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
  const totals = getTransactionSummary(transactions)
  // Loans move money without being income or spending, as in the totals.
  const count = (kind: "income" | "expense") =>
    transactions.filter((transaction) => transaction.kind === kind && transaction.source !== "debt").length

  return (
    <FlowTiles
      className={className}
      tiles={[
        {
          value: "income",
          label: "Tiền vào",
          amount: totals.income,
          caption: `${count("income")} giao dịch`,
          icon: ArrowDownLeftIcon,
          tone: "income",
        },
        {
          value: "expense",
          label: "Tiền ra",
          amount: totals.expense,
          caption: `${count("expense")} giao dịch`,
          icon: ArrowUpRightIcon,
          tone: "expense",
        },
      ]}
    />
  )
}
