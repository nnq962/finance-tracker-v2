import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { TransactionItem } from "./transaction-item"

import type { TransactionDateGroup as TransactionDateGroupModel } from "../_types/transaction"

type TransactionDateGroupProps = {
  group: TransactionDateGroupModel
}

export function TransactionDateGroup({ group }: TransactionDateGroupProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-4">
        <h2 className="w-32 shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {group.label}
        </h2>
        <Separator className="min-w-0 flex-1" />
      </div>
      <Card size="sm">
        <CardContent className="-my-3">
          {group.transactions.map((transaction, index) => (
            <div key={transaction.id}>
              {index > 0 ? <Separator /> : null}
              <TransactionItem transaction={transaction} />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
