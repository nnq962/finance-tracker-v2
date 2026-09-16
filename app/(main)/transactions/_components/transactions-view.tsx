import type { Transaction } from "../_types/transaction"
import { TransactionList } from "./transaction-list"

type TransactionsViewProps = {
  transactions: Transaction[]
}

export function TransactionsView({
  transactions,
}: TransactionsViewProps) {
  return (
    <section>
      <TransactionList transactions={transactions} />
    </section>
  )
}
