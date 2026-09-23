import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getTransactions } from "@/lib/transactions/repository"

import { TransactionsDashboard } from "./_components/transactions-dashboard"
import { getTransactionDateKey } from "./_lib/get-transaction-period"

export default async function TransactionsPage() {
  const user = await requireSession()
  const [transactions, accounts, categoryGroups] = await Promise.all([
    getTransactions(user.uid),
    getAccounts(user.uid),
    getCategoryGroups(user.uid),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <TransactionsDashboard
        accounts={accounts}
        categoryGroups={categoryGroups}
        todayDateKey={getTransactionDateKey(new Date())}
        transactions={transactions}
      />
    </div>
  )
}
