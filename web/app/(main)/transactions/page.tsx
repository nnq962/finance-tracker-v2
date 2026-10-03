import { Page } from "@/components/page"
import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getPlanState } from "@/lib/plans/repository"
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
  searchParams: Promise<{ month?: string; account?: string; ai?: string }>
}) {
  const { month, account, ai } = await searchParams
  const todayDateKey = getTransactionDateKey(new Date())
  const selectedMonth = getTransactionMonthKey(month, todayDateKey)
  const range = getTransactionMonthRange(selectedMonth, 1)
  const {
    data: [transactions, accounts, categoryGroups, planState],
  } = await loadWithSession((user) =>
    Promise.all([
      // Loans live on the debts page.
      getTransactionsInRange(user.uid, range.start, range.end, { excludeDebts: true }),
      getAccounts(user.uid),
      getCategoryGroups(user.uid),
      getPlanState(user.uid),
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
        aiQuota={{ used: planState.aiUsed, limit: planState.aiLimit, credits: planState.aiCredits }}
        // Opened from the AI mission on the overview.
        initialAiOpen={ai === "1"}
      />
    </Page>
  )
}
