import { SummaryCard } from "./summary-card"

import type { TransactionSummaryData } from "../_types/transaction"

type TransactionSummaryProps = {
  summary: TransactionSummaryData
}

export function TransactionSummary({ summary }: TransactionSummaryProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard label="Số dư ròng" value={summary.netBalance} />
      <SummaryCard label="Đã thu" value={summary.income} tone="income" />
      <SummaryCard label="Đã chi" value={summary.expense} tone="expense" />
    </section>
  )
}
