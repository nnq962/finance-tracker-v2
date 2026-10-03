import { Page, PageHeader } from "@/components/page"
import { loadWithSession } from "@/lib/auth/session"
import { getAccounts } from "@/lib/accounts/repository"
import { getBalanceSummary } from "@/lib/accounts/summary"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getRecentTransactionsByAccount } from "@/lib/transactions/repository"

import { AccountList } from "./_components/account-list"
import { AddAccountButton } from "./_components/add-account-button"
import { BalanceHero } from "./_components/balance-hero"
import { BudgetLayout } from "./_components/budget-layout"

export default async function AccountsPage() {
  const { data: [accounts, recentTransactions, categoryGroups] } = await loadWithSession((user) =>
    Promise.all([
      getAccounts(user.uid),
      // A few per account, shown when its sheet opens without another round trip.
      getRecentTransactionsByAccount(user.uid),
      // Their categories' icons.
      getCategoryGroups(user.uid),
    ]),
  )
  const balanceSummary = getBalanceSummary(accounts)

  return (
    <Page>
      <PageHeader
        title="Ngân sách"
        actions={<AddAccountButton />}
      />
      {accounts.length > 0 ? (
        <BudgetLayout
          summary={<BalanceHero summary={balanceSummary} accounts={accounts} />}
        >
          <AccountList accounts={accounts} recentTransactions={recentTransactions} categoryGroups={categoryGroups} />
        </BudgetLayout>
      ) : (
        <AccountList accounts={accounts} recentTransactions={recentTransactions} categoryGroups={categoryGroups} />
      )}
      {/* On mobile the action floats above the bottom nav so it stays within
          thumb reach while scrolling. The empty state carries its own button. */}
      {accounts.length > 0 ? (
        <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end md:hidden">
          <div className="pointer-events-auto">
            <AddAccountButton />
          </div>
        </div>
      ) : null}
    </Page>
  )
}
