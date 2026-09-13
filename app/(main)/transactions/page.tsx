import { TransactionsDashboard } from "./_components/transactions-dashboard"
import { transactions } from "./_data/transactions"

export default function TransactionsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <TransactionsDashboard transactions={transactions} />
    </div>
  )
}
