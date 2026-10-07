import { Stat, StatGroup } from "@/components/app/stat-group"
import { Card, CardContent } from "@/components/ui/card"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

import { getTransactionSummary } from "../_lib/get-transaction-summary"
import type { Transaction } from "../_types/transaction"

/**
 * What came in, went out and the difference for the transactions listed, so
 * a search or filter shows its own totals. One line of figures whatever they
 * are, so the card never changes height; a figure is coloured only when it is
 * not zero.
 */
export function MonthSummary({ transactions, className }: { transactions: Transaction[]; className?: string }) {
  const { income, expense, netBalance } = getTransactionSummary(transactions)

  return (
    <Card className={className}>
      <CardContent>
        <StatGroup>
          <Stat
            label="Thu"
            title={formatCurrency(income)}
            value={<span className={cn(income > 0 && "text-income")}>{formatCompactCurrency(income, 1)}</span>}
          />
          <Stat
            label="Chi"
            title={formatCurrency(expense)}
            value={<span className={cn(expense > 0 && "text-expense")}>{formatCompactCurrency(expense, 1)}</span>}
          />
          <Stat
            label="Chênh lệch"
            title={formatCurrency(netBalance)}
            value={
              <span className={cn(netBalance > 0 ? "text-income" : netBalance < 0 && "text-expense")}>
                {netBalance > 0 ? "+" : netBalance < 0 ? "−" : ""}
                {formatCompactCurrency(Math.abs(netBalance), 1)}
              </span>
            }
          />
        </StatGroup>
      </CardContent>
    </Card>
  )
}
