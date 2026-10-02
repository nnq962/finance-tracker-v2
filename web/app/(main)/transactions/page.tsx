import { Page } from "@/components/page"
import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"
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
  searchParams: Promise<{ month?: string; account?: string }>
}) {
  const { month, account } = await searchParams
  const todayDateKey = getTransactionDateKey(new Date())
  const selectedMonth = getTransactionMonthKey(month, todayDateKey)
  const range = getTransactionMonthRange(selectedMonth, 1)
  const {
    data: [transactions, accounts, categoryGroups],
  } = await loadWithSession((user) =>
    Promise.all([
      getTransactionsInRange(user.uid, range.start, range.end),
      getAccounts(user.uid),
      getCategoryGroups(user.uid),
    ]),
  )

  return (
    <Page>
      <TransactionsDashboard
        accounts={accounts}
        // Opened from an account's sheet: start filtered to that account.
        initialAccountId={accounts.some((item) => item.id === account) ? account : undefined}
        categoryGroups={categoryGroups}
        selectedMonth={selectedMonth}
        todayDateKey={todayDateKey}
        transactions={transactions}
      />
    </Page>
  )
}
