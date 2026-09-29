import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getTransactionsInRange } from "@/lib/transactions/repository"

import { TransactionsDashboard } from "./_components/transactions-dashboard"
import {
  getTransactionDateKey,
  getTransactionMonthKey,
  getTransactionMonthRange,
} from "./_lib/get-transaction-period"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const user = await requireSession()
  const todayDateKey = getTransactionDateKey(new Date())
  const selectedMonth = getTransactionMonthKey(
    (await searchParams).month,
    todayDateKey,
  )
  const range = getTransactionMonthRange(selectedMonth, 1)
  const [transactions, accounts, categoryGroups] = await Promise.all([
    getTransactionsInRange(user.uid, range.start, range.end),
    getAccounts(user.uid),
    getCategoryGroups(user.uid),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      <TransactionsDashboard
        accounts={accounts}
        categoryGroups={categoryGroups}
        selectedMonth={selectedMonth}
        todayDateKey={todayDateKey}
        transactions={transactions}
      />
    </div>
  )
}
