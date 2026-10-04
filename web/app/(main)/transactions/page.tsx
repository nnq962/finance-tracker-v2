import { Page } from "@/components/page"
import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getPurchaseDraft } from "@/lib/plans/purchase-draft"
import { getPlanState } from "@/lib/plans/repository"
import { getDebtPaymentsInRange, getTransactionsInRange } from "@/lib/transactions/repository"

import { TransactionsDashboard } from "./_components/transactions-dashboard"
import {
  getTransactionDateKey,
  getTransactionMonthKey,
  getTransactionMonthRange,
} from "./_lib/get-transaction-period"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; account?: string; ai?: string; order?: string; grant?: string }>
}) {
  const { month, account, ai, order, grant } = await searchParams
  const todayDateKey = getTransactionDateKey(new Date())
  const selectedMonth = getTransactionMonthKey(month, todayDateKey)
  const range = getTransactionMonthRange(selectedMonth, 1)
  const {
    data: [transactions, accounts, categoryGroups, planState, purchaseDraft],
  } = await loadWithSession((user) =>
    Promise.all([
      // Loans and their repayments are listed too, so every change to a
      // balance shows here; they are edited on the debts page.
      Promise.all([
        getTransactionsInRange(user.uid, range.start, range.end),
        getDebtPaymentsInRange(user.uid, range.start, range.end),
      ]).then(([own, repayments]) =>
        [...own, ...repayments].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
      ),
      getAccounts(user.uid),
      getCategoryGroups(user.uid),
      getPlanState(user.uid),
      // A Pro purchase to write down: the buyer's expense, or an admin's income.
      order || grant ? getPurchaseDraft(user, { order, grant }) : undefined,
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
        purchaseDraft={purchaseDraft}
      />
    </Page>
  )
}
